import { useState } from 'react';
import { AppleStyleButton } from './AppleStyleButton';
import AppleNotesEditor from './AppleNotesEditor';

interface NoteFormProps {
    onCreate: (note: { title: string; content: string }, options: { onSuccess: () => void }) => void;
    isPending: boolean;
}

export function NoteForm({ onCreate, isPending }: NoteFormProps) {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim() || content === '<p></p>') return;

        onCreate({ title, content }, {
            onSuccess: () => {
                setTitle('');
                setContent('');
            }
        });
    };

    return (
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
    );
}
