'use client';

import React, { useCallback } from 'react';
import { useEditor, EditorContent, Editor } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TaskList } from '@tiptap/extension-task-list';
import { TaskItem } from '@tiptap/extension-task-item';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Image } from '@tiptap/extension-image';
import {
    Bold,
    Italic,
    Strikethrough,
    List,
    ListOrdered,
    CheckSquare,
    Table as TableIcon,
    Image as ImageIcon
} from 'lucide-react';

const MenuBar = ({ editor }: { editor: Editor | null }) => {
    if (!editor) {
        return null;
    }

    const addImage = useCallback(() => {
        const url = window.prompt('URL of the image:');
        if (url) {
            editor.chain().focus().setImage({ src: url }).run();
        }
    }, [editor]);

    return (
        <div className="flex flex-wrap items-center gap-2 p-2 mb-4 bg-white/50 border border-gray-200/50 rounded-2xl backdrop-blur-md sticky top-4 z-10 transition-all shadow-sm">
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBold().run()}
                disabled={!editor.can().chain().focus().toggleBold().run()}
                className={`p-2 rounded-xl transition-colors ${editor.isActive('bold') ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                title="Bold"
            >
                <Bold size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleItalic().run()}
                disabled={!editor.can().chain().focus().toggleItalic().run()}
                className={`p-2 rounded-xl transition-colors ${editor.isActive('italic') ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                title="Italic"
            >
                <Italic size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleStrike().run()}
                disabled={!editor.can().chain().focus().toggleStrike().run()}
                className={`p-2 rounded-xl transition-colors ${editor.isActive('strike') ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                title="Strikethrough"
            >
                <Strikethrough size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
                type="button"
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                className={`p-2 rounded-xl transition-colors ${editor.isActive('bulletList') ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                title="Bullet List"
            >
                <List size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                className={`p-2 rounded-xl transition-colors ${editor.isActive('orderedList') ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                title="Numbered List"
            >
                <ListOrdered size={18} />
            </button>
            <button
                type="button"
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                className={`p-2 rounded-xl transition-colors ${editor.isActive('taskList') ? 'bg-gray-200 text-gray-900' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-800'}`}
                title="Checklist"
            >
                <CheckSquare size={18} />
            </button>

            <div className="w-px h-6 bg-gray-300 mx-1"></div>

            <button
                type="button"
                onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                title="Insert Table"
            >
                <TableIcon size={18} />
            </button>
            <button
                type="button"
                onClick={addImage}
                className="p-2 rounded-xl text-gray-500 hover:bg-gray-100 hover:text-gray-800 transition-colors"
                title="Insert Image"
            >
                <ImageIcon size={18} />
            </button>
        </div>
    );
};

interface AppleNotesEditorProps {
    content: string;
    onChange: (html: string) => void;
    editable?: boolean;
}

export default function AppleNotesEditor({ content, onChange, editable = true }: AppleNotesEditorProps) {
    const editor = useEditor({
        immediatelyRender: false,
        extensions: [
            StarterKit,
            TaskList,
            TaskItem.configure({
                nested: true,
            }),
            Table.configure({
                resizable: true,
            }),
            TableRow,
            TableHeader,
            TableCell,
            Image.configure({
                inline: true,
                allowBase64: true,
            }),
        ],
        content,
        editable,
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        editorProps: {
            attributes: {
                class: 'prose prose-lg prose-gray max-w-none focus:outline-none min-h-[150px] font-sans prose-p:my-2 prose-img:rounded-2xl prose-img:border prose-img:border-gray-100 prose-table:border-collapse prose-td:border prose-td:border-gray-200 prose-td:p-2 prose-th:bg-gray-50 prose-th:border prose-th:border-gray-200 prose-th:p-2 prose-ul:list-disc prose-ol:list-decimal',
            },
        },
    });

    // Keep parent state synced if content prop changes externally (like resetting after form submit)
    React.useEffect(() => {
        if (editor && content === '' && editor.getHTML() !== '<p></p>') {
            editor.commands.setContent('');
        }
    }, [content, editor]);

    return (
        <div className="flex flex-col w-full group">
            {editable && <MenuBar editor={editor} />}
            <div className="text-gray-800">
                <EditorContent editor={editor} />
            </div>
        </div>
    );
}
