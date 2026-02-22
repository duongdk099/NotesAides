'use client';

import { useState, useEffect } from 'react';
import { useNotes, useCreateNote } from '../hooks/useNotes';
import { AppleStyleButton } from '../components/AppleStyleButton';
import { useAuth } from '../contexts/AuthContext';
import { useRouter } from 'next/navigation';
import AppleNotesEditor from '../components/AppleNotesEditor';

export default function Home() {
  const { data: notes, isLoading, isError } = useNotes();
  const { mutate: createNote, isPending } = useCreateNote();
  const { token, logout } = useAuth();
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const [mounted, setMounted] = useState(false);

  // Protect route
  useEffect(() => {
    setMounted(true);
    if (!token && typeof window !== 'undefined') {
      // Auth provider handles redirect generally, but just in case
    }
  }, [token]);

  if (!mounted || !token) {
    return null; // Or a loading spinner
  }


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || content === '<p></p>') return;

    createNote({ title, content }, {
      onSuccess: () => {
        setTitle('');
        setContent(''); // Reset editor content
      }
    });
  };

  return (
    <main className="min-h-screen bg-[#FBFBFD] py-24 text-gray-900 font-sans px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <div className="space-y-4">
            <h1 className="text-5xl font-semibold tracking-tight text-gray-900">
              NotesAides
            </h1>
            <p className="text-xl text-gray-500 max-w-2xl font-light">
              Capture your thoughts effortlessly with a premium, Apple-inspired experience built on modern edge tools.
            </p>
          </div>
          <button
            onClick={logout}
            className="px-4 py-2 border border-gray-200 text-gray-600 rounded-full hover:bg-gray-100 transition-colors text-sm font-medium"
          >
            Log Out
          </button>
        </div>

        {/* Input Form Section */}
        <div className="bg-white/70 backdrop-blur-xl border border-gray-200/50 rounded-3xl p-8 shadow-sm transition-all duration-300 hover:shadow-md">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Title your note..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-transparent text-3xl font-semibold outline-none placeholder:text-gray-300 transition-all text-gray-800 focus:placeholder:text-gray-200"
              />
              <AppleNotesEditor
                content={content}
                onChange={setContent}
              />
            </div>
            <div className="flex justify-end pt-4 border-t border-gray-100">
              <AppleStyleButton type="submit" disabled={isPending || !title || !content || content === '<p></p>'}>
                {isPending ? 'Saving...' : 'Save Note'}
              </AppleStyleButton>
            </div>
          </form>
        </div>

        {/* Notes Grid Display */}
        <div className="space-y-6">
          <h2 className="text-2xl font-medium tracking-tight border-b border-gray-200 pb-2">Recent Notes</h2>

          {isLoading && (
            <div className="animate-pulse space-y-4">
              <div className="h-32 bg-gray-200 rounded-3xl"></div>
              <div className="h-32 bg-gray-200 rounded-3xl"></div>
            </div>
          )}

          {isError && (
            <div className="p-4 bg-red-50 text-red-600 rounded-2xl">
              Failed to load notes. Ensure the API is running at port 3001.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {notes?.map((note) => (
              <div
                key={note.id}
                className="group relative bg-white border border-gray-200 rounded-3xl p-6 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 overflow-hidden"
              >
                <div className="space-y-3">
                  <h3 className="font-semibold text-xl text-gray-900 truncate pr-8">{note.title}</h3>
                  <div
                    className="prose prose-sm prose-gray line-clamp-4 leading-relaxed prose-img:hidden"
                    dangerouslySetInnerHTML={{ __html: note.content }}
                  />
                </div>
                <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <span className="text-xs text-gray-400 font-mono tracking-wider">
                    {new Date(note.createdAt).toLocaleDateString(undefined, {
                      month: 'short', day: 'numeric', year: 'numeric'
                    })}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
