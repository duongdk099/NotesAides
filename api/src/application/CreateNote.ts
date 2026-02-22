import { Note, INoteRepository } from '../domain/Note';

export class CreateNoteUseCase {
    constructor(private noteRepository: INoteRepository) { }

    async execute(userId: string, title: string, content: string): Promise<Note> {
        const note: Note = {
            id: crypto.randomUUID(),
            userId,
            title,
            content,
            createdAt: new Date(),
        };
        await this.noteRepository.save(note);
        return note;
    }
}
