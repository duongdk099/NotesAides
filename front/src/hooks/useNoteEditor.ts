
import { useState, useEffect, useRef, useCallback } from 'react';
import { useEditor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import { Note } from '../lib/types';
import { optimizeImage } from '../lib/imageOptimizer';
import { useAuth } from '../contexts/AuthContext';

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'optimizing';

interface UseNoteEditorProps {
    note?: Note | null;
    onSave: (note: { title: string; content: string }) => void;
    isPending: boolean;
}

export function useNoteEditor({ note, onSave, isPending }: UseNoteEditorProps) {
    const [title, setTitle] = useState(note?.title || '');
    const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
    const autoSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const { token } = useAuth();

    // Use refs to avoid stale closures
    const titleRef = useRef(title);
    titleRef.current = title;
    const onSaveRef = useRef(onSave);
    onSaveRef.current = onSave;

    useEffect(() => {
        if (note) {
            setTitle(note.title);
            titleRef.current = note.title;
        }
    }, [note]);

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
    }, []);

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
        editorProps: {
            handleDrop: (view, event, slice, moved) => {
                if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
                    const file = event.dataTransfer.files[0];
                    if (file.type.startsWith('image/')) {
                        handleFileUpload(file);
                        return true;
                    }
                }
                return false;
            },
            handlePaste: (view, event) => {
                if (event.clipboardData && event.clipboardData.files && event.clipboardData.files[0]) {
                    const file = event.clipboardData.files[0];
                    if (file.type.startsWith('image/')) {
                        handleFileUpload(file);
                        return true;
                    }
                }
                return false;
            },
            attributes: {
                class: 'prose prose-lg dark:prose-invert prose-gray max-w-none focus:outline-none min-h-[500px] font-sans prose-p:my-2 prose-headings:font-bold prose-headings:tracking-tight prose-img:rounded-3xl prose-img:border prose-img:border-apple-border prose-ul:list-disc prose-ol:list-decimal selection:bg-accent/30',
            },
        },
    }, [note?.id]); // Re-init if note ID changes

    const handleFileUpload = async (file: File) => {
        if (!editor || !token) return;

        try {
            setSaveStatus('optimizing');
            const optimizedFile = await optimizeImage(file);

            const formData = new FormData();
            formData.append('file', optimizedFile);

            setSaveStatus('saving');
            const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
            const response = await fetch(`${baseUrl}/upload`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` },
                body: formData,
            });

            if (!response.ok) throw new Error('Upload failed');

            const data = await response.json();
            editor.chain().focus().setImage({ src: data.url }).run();
            setSaveStatus('saved');
        } catch (error) {
            console.error('[Editor] Upload error:', error);
            setSaveStatus('idle');
        }
    };

    const handleTitleChange = (newTitle: string) => {
        setTitle(newTitle);
        titleRef.current = newTitle;
        triggerAutoSave();
    };

    useEffect(() => {
        if (!isPending && saveStatus === 'saving') {
            setSaveStatus('saved');
            const timer = setTimeout(() => setSaveStatus('idle'), 2500);
            return () => clearTimeout(timer);
        }
    }, [isPending, saveStatus]);

    return {
        editor,
        title,
        saveStatus,
        handleTitleChange,
        handleFileUpload,
        setSaveStatus
    };
}
