import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/notesdb';
export const client = postgres(connectionString);
export const db = drizzle(client, { schema });
