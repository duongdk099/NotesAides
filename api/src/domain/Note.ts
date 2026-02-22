// Notes Application Interfaces and Types
export interface Note {
    id: string;
    userId: string;
    title: string;
    content: string;
    createdAt: Date;
}

export interface INoteRepository {
    save(note: Note): Promise<void>;
    findById(id: string, userId: string): Promise<Note | null>;
    findAll(userId: string): Promise<Note[]>;
    update(id: string, userId: string, note: Partial<Note>): Promise<void>;
    delete(id: string, userId: string): Promise<void>;
}
