import { Hono } from 'hono';
import { jwt } from 'hono/jwt';
import { CreateNoteUseCase } from '../application/CreateNote';
import { GetNoteUseCase } from '../application/GetNote';
import { UpdateNoteUseCase } from '../application/UpdateNote';
import { DeleteNoteUseCase } from '../application/DeleteNote';
import { DrizzleNoteRepository } from '../infrastructure/DrizzleNoteRepository';

const noteRoutes = new Hono();

const jwtSecret = process.env.JWT_SECRET || 'supersecretkey_change_in_production';
noteRoutes.use('*', jwt({ secret: jwtSecret, alg: 'HS256' }));

const noteRepository = new DrizzleNoteRepository();
const createNoteUseCase = new CreateNoteUseCase(noteRepository);
const getNoteUseCase = new GetNoteUseCase(noteRepository);
const updateNoteUseCase = new UpdateNoteUseCase(noteRepository);
const deleteNoteUseCase = new DeleteNoteUseCase(noteRepository);

noteRoutes.post('/', async (c) => {
    const payload = c.get('jwtPayload') as { sub: string };
    const body = await c.req.json();
    const note = await createNoteUseCase.execute(payload.sub, body.title, body.content);
    return c.json(note, 201);
});

noteRoutes.get('/', async (c) => {
    const payload = c.get('jwtPayload') as { sub: string };
    const notes = await noteRepository.findAll(payload.sub);
    return c.json(notes);
});

noteRoutes.get('/:id', async (c) => {
    const payload = c.get('jwtPayload') as { sub: string };
    const id = c.req.param('id');
    const note = await getNoteUseCase.execute(id, payload.sub);
    if (!note) {
        return c.json({ error: 'Note not found' }, 404);
    }
    return c.json(note);
});

noteRoutes.put('/:id', async (c) => {
    const payload = c.get('jwtPayload') as { sub: string };
    const id = c.req.param('id');
    const body = await c.req.json();
    const note = await updateNoteUseCase.execute(id, payload.sub, body.title, body.content);
    if (!note) {
        return c.json({ error: 'Note not found' }, 404);
    }
    return c.json(note);
});

noteRoutes.delete('/:id', async (c) => {
    const payload = c.get('jwtPayload') as { sub: string };
    const id = c.req.param('id');
    const success = await deleteNoteUseCase.execute(id, payload.sub);
    if (!success) {
        return c.json({ error: 'Note not found' }, 404);
    }
    return c.json({ message: 'Note deleted successfully' });
});

export default noteRoutes;
