import { Note, INoteRepository } from '../domain/Note';

export class UpdateNoteUseCase {
    constructor(private noteRepository: INoteRepository) { }

    async execute(id: string, userId: string, title?: string, content?: string): Promise<Note | null> {
        const note = await this.noteRepository.findById(id, userId);
        if (!note) {
            return null;
        }

        const updatedNoteData: Partial<Note> = {};
        if (title !== undefined) updatedNoteData.title = title;
        if (content !== undefined) updatedNoteData.content = content;

        await this.noteRepository.update(id, userId, updatedNoteData);

        // Return updated note
        return { ...note, ...updatedNoteData };
    }
}
