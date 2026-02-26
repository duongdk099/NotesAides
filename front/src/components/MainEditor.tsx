
'use client';

import { useRef } from 'react';
import { EditorContent } from '@tiptap/react';
import { Share, Trash2 } from 'lucide-react';
import { Note } from '../lib/types';
import { useNoteEditor } from '../hooks/useNoteEditor';
import { EditorToolbar, ToolbarButton } from './editor/EditorToolbar';
import { StatusBadge } from './editor/StatusBadge';

interface MainEditorProps {
    note?: Note | null;
    onSave: (note: { title: string; content: string }) => void;
    onDelete?: (id: string) => void;
    isPending: boolean;
}

export function MainEditor({ note, onSave, onDelete, isPending }: MainEditorProps) {
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Everything complex is now hidden in this hook
    const {
        editor,
        title,
        saveStatus,
        handleTitleChange,
        handleFileUpload
    } = useNoteEditor({ note, onSave, isPending });

    if (note === undefined) {
        return <EmptyState />;
    }

    const titleDateFormatted = new Date(note?.createdAt || Date.now()).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric'
    }) + ' at ' + new Date(note?.createdAt || Date.now()).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
    });

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative paper-texture">
            {/* CLEAN HEADER SECTION */}
            <header className="editor-header">
                <EditorToolbar
                    editor={editor}
                    onAddImage={() => fileInputRef.current?.click()}
                />

                <div className="flex items-center gap-3">
                    <StatusBadge status={saveStatus} createdAt={note?.createdAt} />

                    <div className="flex items-center gap-1">
                        <ToolbarButton icon={<Share size={18} />} onClick={() => { }} title="Share" />
                        <ToolbarButton
                            icon={<Trash2 size={18} />}
                            onClick={() => {
                                if (note?.id && onDelete && confirm('Are you sure?')) {
                                    onDelete(note.id);
                                }
                            }}
                            title="Delete"
                        />
                    </div>
                </div>
            </header>

            {/* SCROLLABLE CONTENT AREA */}
            <main className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
                <div className="editor-content-container">
                    <span className="date-label">{titleDateFormatted}</span>

                    <input
                        type="text"
                        placeholder="Title"
                        value={title}
                        onChange={(e) => handleTitleChange(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && editor?.commands.focus()}
                        className="title-input"
                    />

                    <div className="min-h-[60vh] prose-container">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </main>

            {/* HIDDEN INPUTS */}
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                    e.target.value = '';
                }}
            />
        </div>
    );
}

function EmptyState() {
    return (
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
                    Select a note from the sidebar to start writing, or capture a new thought.
                </p>
            </div>
        </div>
    );
}
