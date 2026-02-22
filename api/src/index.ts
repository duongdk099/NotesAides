import { Hono } from 'hono'
import { cors } from 'hono/cors'
import noteRoutes from './interface/routes'
import authRoutes from './interface/authRoutes'

const app = new Hono()

app.use('*', cors())

app.get('/', (c) => {
    return c.text('Hello from NotesAides API!')
})

app.route('/notes', noteRoutes)
app.route('/auth', authRoutes)

export default {
    port: 3001,
    fetch: app.fetch,
}
