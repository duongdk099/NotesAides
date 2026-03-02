'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSync } from '@/hooks/useSync';
import { Sidebar } from '@/components/Sidebar';
import { NoteList } from '@/components/NoteList';
import { useNotes, useSearchNotes } from '@/hooks/useNotes';

export default function Home() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const { data: allNotes, isLoading, isError } = useNotes();
  const { data: searchResults, isLoading: isSearching } = useSearchNotes(searchQuery);
  const [mounted, setMounted] = useState(false);

  useSync();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || !token) {
    return null;
  }

  const notes = searchQuery.trim() ? searchResults : allNotes;
  const isNotesLoading = searchQuery.trim() ? isSearching : isLoading;

  return (
    <main className="flex h-screen w-full bg-background overflow-hidden relative">
      <div className="hidden md:block">
        <Sidebar
          onNewNote={() => router.push('/notes/new')}
          onLogout={logout}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      </div>
      <NoteList
        notes={notes}
        isLoading={isNotesLoading}
        isError={isError}
        selectedId={undefined}
        onSelect={(note) => router.push(`/notes/${note.id}`)}
        searchQuery={searchQuery}
        onClearSearch={() => setSearchQuery('')}
      />
      <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 paper-texture">
        <div className="relative">
          <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
          <div className="relative w-32 h-32 bg-zinc-100 dark:bg-zinc-800 rounded-[3rem] flex items-center justify-center shadow-2xl backdrop-blur-sm border border-apple-border">
            <span className="text-6xl drop-shadow-md">📒</span>
          </div>
        </div>
        <div className="space-y-3 max-w-sm">
          <h3 className="text-3xl font-bold tracking-tight italic">Notes</h3>
          <p className="text-zinc-500 font-medium">
            Select a note from the sidebar to start writing, or create a new one.
          </p>
        </div>
      </div>
    </main>
  );
}
