'use client';

import { useState, useEffect } from 'react';
import { useNotes, useCreateNote, useUpdateNote, useDeleteNote } from '../hooks/useNotes';
import { useAuth } from '../contexts/AuthContext';
import { useSync } from '../hooks/useSync';
import { Sidebar } from '../components/Sidebar';
import { NoteList } from '../components/NoteList';
import { MainEditor } from '../components/MainEditor';
import { Note } from '../lib/types';

export default function Home() {
  const { data: notes, isLoading, isError } = useNotes();
  const { mutate: createNote, isPending: isCreating } = useCreateNote();
  const { mutate: updateNote, isPending: isUpdating } = useUpdateNote();
  const { mutate: deleteNote } = useDeleteNote();
  const { token, logout } = useAuth();

  // Activate real-time sync
  useSync();

  const [selectedNote, setSelectedNote] = useState<Note | null | undefined>(undefined);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !token) {
    return null;
  }

  const handleNewNote = () => {
    setSelectedNote(null); // null means "creating new"
  };

  const handleSave = (data: { title: string; content: string }) => {
    if (selectedNote?.id) {
      updateNote(
        { id: selectedNote.id, ...data },
        {
          onSuccess: (updatedNote) => setSelectedNote(updatedNote)
        }
      );
    } else {
      createNote(data, {
        onSuccess: (newNote) => setSelectedNote(newNote)
      });
    }
  };

  const handleDelete = (id: string) => {
    deleteNote(id, {
      onSuccess: () => {
        setSelectedNote(undefined);
      }
    });
  };

  return (
    <main className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Pane 1: Sidebar */}
      <div className="hidden md:block">
        <Sidebar onNewNote={handleNewNote} onLogout={logout} />
      </div>

      {/* Pane 2: Note List */}
      <NoteList
        notes={notes}
        isLoading={isLoading}
        isError={isError}
        selectedId={selectedNote?.id}
        onSelect={(note) => setSelectedNote(note)}
      />

      {/* Pane 3: Editor - Dynamic Key forces fresh instance on note switch */}
      <MainEditor
        key={selectedNote?.id || (selectedNote === null ? 'new' : 'empty')}
        note={selectedNote}
        onSave={handleSave}
        onDelete={handleDelete}
        isPending={isCreating || isUpdating}
      />
    </main>
  );
}


