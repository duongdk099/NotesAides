import { Note, INoteRepository } from '../domain/Note';
import { db } from './db';
import { notes } from './db/schema';
import { eq, and } from 'drizzle-orm';

export class DrizzleNoteRepository implements INoteRepository {
    async save(note: Note): Promise<void> {
        await db.insert(notes).values({
            id: note.id,
            userId: note.userId,
            title: note.title,
            content: note.content,
            createdAt: note.createdAt,
        });
    }

    async findById(id: string, userId: string): Promise<Note | null> {
        const result = await db.query.notes.findFirst({
            where: and(eq(notes.id, id), eq(notes.userId, userId)),
        });

        if (!result) return null;
        return {
            id: result.id,
            userId: result.userId,
            title: result.title,
            content: result.content,
            createdAt: result.createdAt,
        };
    }

    async findAll(userId: string): Promise<Note[]> {
        const results = await db.query.notes.findMany({
            where: eq(notes.userId, userId),
            orderBy: (notes, { desc }) => [desc(notes.createdAt)],
        });
        return results.map(row => ({
            id: row.id,
            userId: row.userId,
            title: row.title,
            content: row.content,
            createdAt: row.createdAt,
        }));
    }

    async update(id: string, userId: string, noteData: Partial<Note>): Promise<void> {
        await db.update(notes)
            .set(noteData)
            .where(and(eq(notes.id, id), eq(notes.userId, userId)));
    }

    async delete(id: string, userId: string): Promise<void> {
        await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
    }
}
