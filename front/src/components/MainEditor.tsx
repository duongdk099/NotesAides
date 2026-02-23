'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Note } from '../lib/types';
import { formatRelativeTime } from '../lib/utils';
import {
    Bold,
    Italic,
    List,
    CheckSquare,
    Image as ImageIcon,
    Table as TableIcon,
    Share,
    Trash2,
    Check
} from 'lucide-react';

interface MainEditorProps {
    note?: Note | null;
    onSave: (note: { title: string; content: string }) => void;
    isPending: boolean;
}

export function MainEditor({ note, onSave, isPending }: MainEditorProps) {
    const [title, setTitle] = useState(note?.title || '');
    const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Use refs to avoid stale closures in the debounced function
    const titleRef = useRef(title);
    titleRef.current = title;
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    // Sync title from prop on initial load/remount
    useEffect(() => {
        if (note) {
            setTitle(note.title);
            titleRef.current = note.title;
        }
    }, [note]);

    // Force re-render for toolbar active states
    const [, setUpdateCount] = useState(0);

    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit.configure({
                heading: { levels: [1, 2, 3] },
                bulletList: { keepMarks: true, keepAttributes: false },
                orderedList: { keepMarks: true, keepAttributes: false },
            }),
            TaskList,
            TaskItem.configure({ nested: true }),
            Table.configure({
                resizable: true,
                HTMLAttributes: { class: 'apple-table' },
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image.configure({ inline: true, allowBase64: true }),
        ],
        content: note?.content || '',
        onUpdate: () => {
            triggerAutoSave();
        },
        onSelectionUpdate: () => {
            setUpdateCount(c => c + 1);
        },
        onTransaction: () => {
            // This forces the component to re-render when selection or formatting changes
            setUpdateCount(c => c + 1);
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg dark:prose-invert prose-gray max-w-none focus:outline-none min-h-[500px] font-sans prose-p:my-2 prose-headings:font-bold prose-headings:tracking-tight prose-img:rounded-3xl prose-img:border prose-img:border-apple-border prose-img:shadow-sm prose-ul:list-disc prose-ul:marker:text-accent prose-ol:list-decimal prose-ol:marker:text-accent prose-li:my-0 selection:bg-accent/30',
            },
        },
    });

    const triggerAutoSave = useCallback(() => {
        if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);

        setSaveStatus('idle');

        autoSaveTimerRef.current = setTimeout(() => {
            if (!editor) return;
            const currentContent = editor.getHTML();
            const currentTitle = titleRef.current;

            if (!currentTitle.trim() || !currentContent.trim() || currentContent === '<p></p>') return;

            setSaveStatus('saving');
            onSaveRef.current({ title: currentTitle, content: currentContent });
        }, 500);
    }, [editor]);

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        titleRef.current = newTitle;
        triggerAutoSave();
    };

    // Update status to 'saved' when isPending flips from true to false
    useEffect(() => {
        if (!isPending && saveStatus === 'saving') {
            setSaveStatus('saved');
            const timer = setTimeout(() => setSaveStatus('idle'), 2500);
            return () => clearTimeout(timer);
        }
    }, [isPending, saveStatus]);

    const handleTitleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            editor?.commands.focus();
        }
    };

    const addImage = () => {
        const url = window.prompt('URL of the image:');
        if (url && editor) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    };

    const handleTableAction = () => {
        if (!editor) return;

        if (editor.isActive('table')) {
            // If already in a table, add a row instead of inserting a new table
            editor.chain().focus().addRowAfter().run();
        } else {
            // Clean insert: 2x2 table with header
            editor.chain().focus().insertTable({ rows: 2, cols: 2, withHeaderRow: true }).run();
        }
    };

    if (note === undefined) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center space-y-8 paper-texture" style={{ backgroundColor: 'var(--background)' }}>
                <div className="relative">
                    <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full" />
                    <div className="relative w-32 h-32 bg-gradient-to-br from-accent/20 to-accent/5 rounded-[3rem] flex items-center justify-center shadow-2xl backdrop-blur-sm" style={{ borderColor: 'var(--border)' }}>
                        <span className="text-6xl drop-shadow-md">📒</span>
                    </div>
                </div>
                <div className="space-y-3 max-w-sm">
                    <h3 className="text-3xl font-bold tracking-tight italic" style={{ color: 'var(--foreground)' }}>Notes</h3>
                    <p className="text-[16px] font-medium leading-relaxed" style={{ color: 'var(--date-color)' }}>
                        Select a note from the sidebar to start writing, or capture a new thought.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col h-screen overflow-hidden relative paper-texture">
            {/* Toolbar */}
            <header className="h-[52px] flex items-center justify-between px-6 backdrop-blur-2xl sticky top-0 z-20" style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'color-mix(in srgb, var(--background) 80%, transparent)' }}>
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center p-0.5 rounded-xl" style={{ backgroundColor: 'var(--toolbar-group-bg)', border: '1px solid var(--toolbar-group-border)' }}>
                        <ToolbarButton
                            icon={<CheckSquare size={17} strokeWidth={2.5} />}
                            onClick={() => editor?.chain().focus().toggleTaskList().run()}
                            active={editor?.isActive('taskList')}
                            title="Checklist"
                        />
                        <ToolbarButton
                            icon={<List size={17} strokeWidth={2.5} />}
                            onClick={() => editor?.chain().focus().toggleBulletList().run()}
                            active={editor?.isActive('bulletList')}
                            title="Bullet List"
                        />
                        <ToolbarButton
                            icon={<TableIcon size={17} strokeWidth={2.5} />}
                            onClick={handleTableAction}
                            active={editor?.isActive('table')}
                            title={editor?.isActive('table') ? "Add Row" : "Table"}
                        />
                    </div>

                    <div className="w-px h-5 mx-2" style={{ backgroundColor: 'var(--border)' }} />

                    <div className="flex items-center p-0.5 rounded-xl" style={{ backgroundColor: 'var(--toolbar-group-bg)', border: '1px solid var(--toolbar-group-border)' }}>
                        <ToolbarButton
                            icon={<span className="font-serif font-bold text-base leading-none translate-y-[-1px]">Aa</span>}
                            onClick={() => { }}
                            title="Format"
                        />
                        <ToolbarButton
                            icon={<Bold size={17} strokeWidth={2.5} />}
                            onClick={() => editor?.chain().focus().toggleBold().run()}
                            active={editor?.isActive('bold')}
                            title="Bold"
                        />
                        <ToolbarButton
                            icon={<Italic size={17} strokeWidth={2.5} />}
                            onClick={() => editor?.chain().focus().toggleItalic().run()}
                            active={editor?.isActive('italic')}
                            title="Italic"
                        />
                    </div>

                    <div className="w-px h-5 mx-2" style={{ backgroundColor: 'var(--border)' }} />

                    <ToolbarButton icon={<ImageIcon size={18} strokeWidth={2} />} onClick={addImage} title="Add Image" />
                </div>

                <div className="flex items-center gap-3">
                    <div className="px-3 py-1 rounded-full" style={{ backgroundColor: 'var(--toolbar-group-bg)', border: '1px solid var(--toolbar-group-border)' }}>
                        <span className="text-[11px] font-bold uppercase tracking-widest flex items-center gap-2" style={{ color: 'var(--date-color)' }}>
                            {saveStatus === 'saving' && <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />}
                            {saveStatus === 'saving' ? (
                                <span className="text-accent/80">Saving</span>
                            ) : saveStatus === 'saved' ? (
                                <span className="text-green-500/80">Saved</span>
                            ) : (
                                <span>{note ? formatRelativeTime(note.createdAt) : 'Draft'}</span>
                            )}
                        </span>
                    </div>
                    <div className="flex items-center gap-1">
                        <ToolbarButton icon={<Share size={18} strokeWidth={2} />} onClick={() => { }} title="Share Note" />
                        <ToolbarButton icon={<Trash2 size={18} strokeWidth={2} />} onClick={() => { }} title="Delete" />
                    </div>
                </div>
            </header>

            {/* Editor Content Area */}
            <div className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
                <div className="max-w-[820px] mx-auto px-10 pt-12 pb-40">
                    {/* Centered Date */}
                    <div className="flex justify-center mb-10">
                        <span className="text-[11px] font-bold uppercase tracking-[0.1em]" style={{ color: 'var(--date-color)' }}>
                            {new Date(note?.createdAt || Date.now()).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {new Date(note?.createdAt || Date.now()).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>

                    <div className="space-y-8">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => handleTitleChange(e.target.value)}
                            onKeyDown={handleTitleKeyDown}
                            className="w-full bg-transparent text-[42px] font-extrabold outline-none tracking-tight leading-tight"
                            style={{ color: 'var(--foreground)', '--tw-placeholder-opacity': '1' } as React.CSSProperties}
                        />

                        <div className="min-h-[60vh] prose-container">
                            <EditorContent editor={editor} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ToolbarButton({ icon, onClick, active = false, title }: { icon: React.ReactNode, onClick: () => void, active?: boolean, title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title}
            className="w-[38px] h-[32px] flex items-center justify-center rounded-lg transition-all duration-200"
            style={{
                backgroundColor: active ? 'var(--toolbar-active-bg)' : 'transparent',
                color: active ? 'var(--accent)' : 'var(--toolbar-icon)',
                border: active ? '1px solid var(--toolbar-group-border)' : '1px solid transparent',
            }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.color = 'var(--toolbar-icon-hover)'; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.color = 'var(--toolbar-icon)'; }}
        >
            {icon}
        </button>
    );
}
