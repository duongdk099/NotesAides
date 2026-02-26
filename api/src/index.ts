import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createBunWebSocket, serveStatic } from 'hono/bun'
import { verify, jwt } from 'hono/jwt'
import { randomUUID } from 'crypto'
import { join } from 'path'
import noteRoutes from './interface/routes'
import authRoutes from './interface/authRoutes'
import { wsEvents } from './infrastructure/websocket'

const app = new Hono()
const { upgradeWebSocket, websocket } = createBunWebSocket()

app.use('*', cors())

app.get('/', (c) => {
    return c.text('Hello from NotesAides API!')
})

// WebSocket handler for real-time sync
app.get(
    '/ws',
    upgradeWebSocket(async (c) => {
        const token = c.req.query('token')
        const jwtSecret = process.env.JWT_SECRET || 'supersecretkey_change_in_production'

        if (!token) return { status: 4001, reason: 'Token required' }

        try {
            const payload = await verify(token, jwtSecret, 'HS256')
            const userId = payload.sub as string

            return {
                onOpen(evt, ws) {
                    console.log(`[WS] User ${userId} connected`)
                        ; (ws.raw as any).subscribe(`user_${userId}`)
                },
                onClose() {
                    console.log(`[WS] User ${userId} disconnected`)
                },
            }
        } catch (err) {
            return { status: 4001, reason: 'Invalid token' }
        }
    })
)

app.route('/notes', noteRoutes)
app.route('/auth', authRoutes)

// Serve uploaded files
app.use('/uploads/*', serveStatic({ root: './' }))

// Authenticated upload endpoint
const jwtSecret = process.env.JWT_SECRET || 'supersecretkey_change_in_production'
app.post('/upload', jwt({ secret: jwtSecret, alg: 'HS256' }), async (c) => {
    try {
        const body = await c.req.parseBody()
        const file = body['file'] as File

        if (!file) {
            return c.json({ error: 'No file uploaded' }, 400)
        }

        const extension = file.name.split('.').pop()
        const fileName = `${randomUUID()}.${extension}`
        const filePath = join('uploads', fileName)

        // Using Bun.write for efficient file saving
        const bytes = await file.arrayBuffer()
        await Bun.write(filePath, bytes)

        const baseUrl = process.env.API_URL || 'http://localhost:3001'
        return c.json({
            url: `${baseUrl}/uploads/${fileName}`
        })
    } catch (error) {
        console.error('[API] Upload error:', error)
        return c.json({ error: 'Upload failed' }, 500)
    }
})

// Start the Bun server (Bun --watch will naturally handle restarts)
const server = Bun.serve({
    port: Number(process.env.PORT) || 3001,
    fetch: app.fetch,
    websocket,
})

// Clear old event listeners to prevent memory leaks during hot-reload
wsEvents.removeAllListeners('broadcast');

// Listen for notifications from routes and broadcast to subscribers
wsEvents.on('broadcast', ({ userId, type, noteId }) => {
    console.log(`[WS] Broadcasting ${type} for user ${userId}`);
    server.publish(`user_${userId}`, JSON.stringify({ type, noteId }));
});

console.log(`[API] Server running on http://localhost:${server.port}`)
