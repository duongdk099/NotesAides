import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { createBunWebSocket } from 'hono/bun'
import { verify } from 'hono/jwt'
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
            const payload = await verify(token, jwtSecret)
            const userId = payload.sub as string

            return {
                onOpen(evt, ws) {
                    console.log(`[WS] User ${userId} connected`)
                    ws.subscribe(`user_${userId}`)
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

// Handle hot-reloading by stopping the old server instance if it exists
if ((globalThis as any).server) {
    (globalThis as any).server.stop(true);
}

// Start the Bun server
const server = Bun.serve({
    port: 3001,
    fetch: app.fetch,
    websocket,
})

    // Store the server instance globally for hot-reloading cleanup
    ; (globalThis as any).server = server;

// Clear old event listeners to prevent memory leaks during hot-reload
wsEvents.removeAllListeners('broadcast');

// Listen for notifications from routes and broadcast to subscribers
wsEvents.on('broadcast', ({ userId, type, noteId }) => {
    console.log(`[WS] Broadcasting ${type} for user ${userId}`);
    server.publish(`user_${userId}`, JSON.stringify({ type, noteId }));
});

console.log(`[API] Server running on http://localhost:${server.port}`)

export default server
