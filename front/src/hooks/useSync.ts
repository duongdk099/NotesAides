import { useEffect, useRef } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../contexts/AuthContext';

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001/ws';

export function useSync() {
    const { token } = useAuth();
    const queryClient = useQueryClient();
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        if (!token) {
            if (socketRef.current) {
                socketRef.current.close();
                socketRef.current = null;
            }
            return;
        }

        // Establish WebSocket connection
        const socket = new WebSocket(`${WS_URL}?token=${token}`);
        socketRef.current = socket;

        socket.onopen = () => {
            console.log('[WS] Connected to sync server');
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log('[WS] Message received:', data);

                if (data.type === 'NOTE_UPDATED' || data.type === 'NOTE_CREATED' || data.type === 'NOTE_DELETED') {
                    // Invalidate notes list
                    queryClient.invalidateQueries({ queryKey: ['notes'] });

                    // If it's an update, invalidate the specific note too
                    if (data.noteId) {
                        queryClient.invalidateQueries({ queryKey: ['note', data.noteId] });
                    }
                }
            } catch (err) {
                console.error('[WS] Failed to parse message:', err);
            }
        };

        socket.onclose = () => {
            console.log('[WS] Disconnected from sync server');
            socketRef.current = null;
        };

        socket.onerror = (err) => {
            console.error('[WS] Connection error:', err);
        };

        return () => {
            socket.close();
            socketRef.current = null;
        };
    }, [token, queryClient]);

    return socketRef.current;
}
