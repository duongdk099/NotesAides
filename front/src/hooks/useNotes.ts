import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Note } from '../lib/types';
import { useAuth } from '../contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL ? `${process.env.NEXT_PUBLIC_API_URL}/notes` : 'http://localhost:3001/notes';

export function useNotes() {
    const { token } = useAuth();

    return useQuery<Note[]>({
        queryKey: ['notes'],
        queryFn: async () => {
            const res = await fetch(API_URL, {
                headers: {
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                }
            });
            if (!res.ok) throw new Error('Failed to fetch notes');
            return res.json();
        },
        enabled: !!token,
    });
}

export function useCreateNote() {
    const queryClient = useQueryClient();
    const { token } = useAuth();

    return useMutation({
        mutationFn: async (newNote: { title: string; content: string }) => {
            const res = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(token ? { Authorization: `Bearer ${token}` } : {})
                },
                body: JSON.stringify(newNote),
            });
            if (!res.ok) throw new Error('Failed to create note');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notes'] });
        },
    });
}
