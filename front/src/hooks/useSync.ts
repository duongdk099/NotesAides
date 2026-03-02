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
            // Connected to sync server
        };

        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                const noteMutatingEvents = ['NOTE_UPDATED', 'NOTE_CREATED', 'NOTE_DELETED', 'NOTE_RESTORED', 'NOTE_PERMANENTLY_DELETED'];
                if (noteMutatingEvents.includes(data.type)) {
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
}
