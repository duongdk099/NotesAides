import { INoteRepository } from '../domain/Note';

export class DeleteNoteUseCase {
    constructor(private noteRepository: INoteRepository) { }

    async execute(id: string, userId: string): Promise<boolean> {
        const note = await this.noteRepository.findById(id, userId);
        if (!note) {
            return false;
        }

        await this.noteRepository.delete(id, userId);
        return true;
    }
}
