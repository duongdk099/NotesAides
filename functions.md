# NotesAides - Functions & Workflows Documentation

## Project Overview

**NotesAides** is a modern full-stack note-taking application with intelligent knowledge management features. Built with a hybrid architecture using Next.js (frontend), Hono/Bun (API), PostgreSQL (database), and Rust/WASM (image processing).

### Tech Stack

| Layer | Technology |
|-------|------------|
| **Frontend** | Next.js 16, React 19, TypeScript, TailwindCSS |
| **Rich Text Editor** | TipTap (ProseMirror-based) |
| **API** | Hono (Edge-ready web framework), Bun runtime |
| **Database** | PostgreSQL 15 with Drizzle ORM |
| **Image Processing** | Rust + WebAssembly (image-wasm) |
| **State Management** | TanStack React Query |
| **Real-time Sync** | WebSocket |
| **Authentication** | JWT (JSON Web Tokens) |

---

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   API (Hono)    │────▶│  PostgreSQL DB  │
│   (Next.js)     │◀────│   (Bun)         │◀────│  (Drizzle ORM)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │                       ▼
        │              ┌─────────────────┐
        └─────────────▶│  Rust/WASM      │
         Image Upload   │  (image-wasm)   │
                        └─────────────────┘
```

---

## Directory Structure

```
NotesAides/
├── api/                    # Backend API (Hono + Bun)
│   ├── src/
│   │   ├── application/    # Use Cases (Business Logic)
│   │   ├── domain/         # Entities & Interfaces
│   │   ├── infrastructure/ # Database, WebSocket implementations
│   │   └── interface/      # Routes (Controllers)
│   └── drizzle/            # Database migrations
├── front/                  # Frontend (Next.js)
│   └── src/
│       ├── app/            # Next.js App Router pages
│       ├── components/     # React components
│       ├── contexts/       # React contexts (Auth)
│       ├── hooks/          # Custom React hooks
│       └── lib/            # Utilities, types, services
├── image-wasm/             # Rust WASM for image processing
│   └── src/
└── docker-compose.yml      # Docker services orchestration
```

---

## Core Workflows

### 1. Authentication Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Frontend │────▶│   API    │────▶│ Database │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ 1. Register    │                │                │
     │───────────────▶│                │                │
     │                │ 2. Hash pass   │                │
     │                │───────────────▶│                │
     │                │                │ 3. Save user   │
     │                │                │───────────────▶│
     │                │                │                │
     │ 4. Login       │                │                │
     │───────────────▶│                │                │
     │                │ 5. Verify pass │                │
     │                │───────────────▶│                │
     │                │ 6. Generate JWT│                │
     │                │◀───────────────│                │
     │ 7. Store token │                │                │
     │◀───────────────│                │                │
```

**Related Files:**
- `api/src/application/RegisterUser.ts` - User registration use case
- `api/src/application/LoginUser.ts` - User login & JWT generation
- `api/src/application/ForgetPassword.ts` - Password reset token generation
- `api/src/application/ResetPassword.ts` - Password reset with token
- `api/src/interface/authRoutes.ts` - Auth HTTP endpoints
- `front/src/contexts/AuthContext.tsx` - Frontend auth state management
- `front/src/app/login/page.tsx` - Login page
- `front/src/app/register/page.tsx` - Registration page

---

### 2. Note CRUD Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Frontend │────▶│   API    │────▶│ Database │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ Create/Edit    │                │                │
     │───────────────▶│                │                │
     │                │ Auto-save      │                │
     │                │ (1s debounce)  │                │
     │                │───────────────▶│                │
     │                │                │ Save note      │
     │                │                │───────────────▶│
     │                │                │                │
     │                │◀───────────────│                │
     │◀───────────────│                │                │
     │                │                │                │
     │                │ WebSocket      │                │
     │                │◀───────────────│                │
     │ Sync update    │                │                │
     │◀───────────────│                │                │
```

**Related Files:**
- `api/src/application/CreateNote.ts` - Create note use case
- `api/src/application/GetNote.ts` - Get single note use case
- `api/src/application/UpdateNote.ts` - Update note with retry logic
- `api/src/application/DeleteNote.ts` - Soft/hard delete use cases
- `api/src/interface/routes.ts` - Note HTTP endpoints
- `api/src/infrastructure/DrizzleNoteRepository.ts` - Database operations
- `front/src/hooks/useNotes.ts` - React Query hooks for notes
- `front/src/hooks/useNoteEditor.ts` - Editor state & auto-save
- `front/src/app/actions/notes.ts` - Next.js Server Actions

---

### 3. Image Upload & Processing Flow

```
┌──────────┐     ┌──────────┐     ┌──────────┐     ┌──────────┐
│  User    │────▶│ Frontend │────▶│ WASM/Rust │────▶│   API    │
└──────────┘     └──────────┘     └──────────┘     └──────────┘
     │                │                │                │
     │ Drop/Paste     │                │                │
     │───────────────▶│                │                │
     │                │ Optimize       │                │
     │                │ (resize)       │                │
     │                │───────────────▶│                │
     │                │◀───────────────│                │
     │                │ WebP file      │                │
     │                │                │                │
     │                │ Upload         │                │
     │                │───────────────────────────────▶│
     │                │                │ Save file      │
     │                │                │───────────────▶│
     │                │◀───────────────────────────────│
     │ Insert image   │                │                │
     │◀───────────────│                │                │
```

**Related Files:**
- `image-wasm/src/lib.rs` - Rust WASM image processing (resize, crop, rotate)
- `front/src/lib/imageOptimizer.ts` - WASM integration & Canvas WebP encoding
- `front/src/components/editor/extensions/ResizableImage.ts` - TipTap image extension
- `front/src/components/editor/ImageCropModal.tsx` - Image cropping UI
- `api/src/index.ts` - File upload endpoint

---

### 4. Real-time Sync Flow (WebSocket)

```
┌──────────┐     ┌──────────┐     ┌──────────┐
│ Client A │────▶│   API    │◀────│ Client B │
└──────────┘     └──────────┘     └──────────┘
     │                │                │
     │ Edit note      │                │
     │───────────────▶│                │
     │                │ Broadcast      │
     │                │───────────────▶│
     │                │ NOTE_UPDATED   │
     │                │                │
     │                │ Invalidate     │
     │                │ React Query    │
     │                │───────────────▶│
     │                │                │ Refetch data
     │                │                │───────────────▶
```

**Related Files:**
- `api/src/infrastructure/websocket.ts` - WebSocket event emitter
- `api/src/index.ts` - WebSocket connection handler
- `front/src/hooks/useSync.ts` - Frontend WebSocket client with reconnection

---

## API Endpoints

### Authentication (`/auth`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/auth/register` | Register new user | No |
| POST | `/auth/login` | Login & get JWT token | No |
| POST | `/auth/forget-password` | Generate password reset token | No |
| POST | `/auth/reset-password` | Reset password with token | No |

### Notes (`/notes`)

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/notes` | Get all active notes | Yes |
| GET | `/notes/:id` | Get single note | Yes |
| GET | `/notes/search?q=` | Search notes | Yes |
| GET | `/notes/deleted` | Get soft-deleted notes | Yes |
| POST | `/notes` | Create new note | Yes |
| PUT/PATCH | `/notes/:id` | Update note | Yes |
| DELETE | `/notes/:id` | Soft delete note | Yes |
| POST | `/notes/:id/restore` | Restore deleted note | Yes |
| DELETE | `/notes/:id/permanent` | Permanently delete | Yes |

### File Upload

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/upload` | Upload image file | Yes |

### WebSocket

| Endpoint | Description |
|----------|-------------|
| `/ws?token=` | Real-time sync connection |

---

## Use Cases (Application Layer)

### Authentication Use Cases

#### RegisterUserUseCase
**File:** `api/src/application/RegisterUser.ts`
- Validates email format
- Validates password strength (min 8 chars)
- Checks for existing user
- Hashes password with Bun.password.hash()
- Creates new user

#### LoginUserUseCase
**File:** `api/src/application/LoginUser.ts`
- Finds user by email
- Verifies password
- Generates JWT token (7 days expiry)
- Returns token + user data

#### ForgetPasswordUseCase
**File:** `api/src/application/ForgetPassword.ts`
- Generates UUID reset token
- Sets 1-hour expiry
- Updates user record
- Returns token (would email in production)

#### ResetPasswordUseCase
**File:** `api/src/application/ResetPassword.ts`
- Validates token & expiry
- Hashes new password
- Clears reset token

---

### Note Use Cases

#### CreateNoteUseCase
**File:** `api/src/application/CreateNote.ts`
- Generates UUID
- Creates note object
- Saves to repository

#### GetNoteUseCase
**File:** `api/src/application/GetNote.ts`
- Retrieves note by ID & userId
- Filters out deleted notes

#### UpdateNoteUseCase
**File:** `api/src/application/UpdateNote.ts`
- Retry logic (5 attempts) for race conditions
- Handles concurrent edits
- Returns updated note

#### DeleteNoteUseCase
**File:** `api/src/application/DeleteNote.ts`
- **Soft delete**: Sets `deletedAt` timestamp
- **Permanent delete**: Removes from database
- **Restore**: Clears `deletedAt`

---

## Domain Layer (Entities)

### Note Entity
**File:** `api/src/domain/Note.ts`

```typescript
interface Note {
    id: string;
    userId: string;
    title: string;
    content: JSONContent;  // TipTap JSON format
    createdAt: Date;
    deletedAt?: Date | null;
}
```

### User Entity
**File:** `api/src/domain/User.ts`

```typescript
interface User {
    id: string;
    email: string;
    passwordHash: string;
    resetToken: string | null;
    resetTokenExpiry: Date | null;
    createdAt: Date;
}
```

---

## Infrastructure Layer

### Database Schema
**File:** `api/src/infrastructure/db/schema.ts`

```sql
-- Notes table
id (varchar, PK)
user_id (varchar, FK -> users.id, cascade delete)
title (varchar)
content (jsonb)
created_at (timestamp)
deleted_at (timestamp, nullable)

-- Users table
id (varchar, PK)
email (varchar, unique)
password_hash (varchar)
reset_token (varchar, nullable)
reset_token_expiry (timestamp, nullable)
created_at (timestamp)
```

### Repositories

#### DrizzleNoteRepository
**File:** `api/src/infrastructure/DrizzleNoteRepository.ts`
- `save(note)` - Insert new note
- `findById(id, userId)` - Get note (excludes deleted)
- `findAll(userId)` - Get all active notes
- `findDeleted(userId)` - Get soft-deleted notes
- `update(id, userId, data)` - Update note
- `restore(id, userId)` - Clear deletedAt
- `delete(id, userId)` - Soft delete
- `permanentDelete(id, userId)` - Hard delete
- `search(userId, query)` - ILIKE search on title/content

#### DrizzleUserRepository
**File:** `api/src/infrastructure/DrizzleUserRepository.ts`
- `save(user)` - Insert new user
- `findByEmail(email)` - Find by email
- `findById(id)` - Find by ID
- `findByResetToken(token)` - Find by reset token
- `update(id, data)` - Update user

---

## Frontend Components

### Pages (Next.js App Router)

| Path | Component | Description |
|------|-----------|-------------|
| `/` | `page.tsx` | Home with notes overview & list |
| `/login` | `login/page.tsx` | Login form |
| `/register` | `register/page.tsx` | Registration form |
| `/notes/new` | `notes/new/page.tsx` | Create new note |
| `/notes/[id]` | `notes/[id]/page.tsx` | Edit existing note |
| `/notes/deleted` | `notes/deleted/page.tsx` | Trash/recycle bin |

### Core Components

#### Sidebar
**File:** `front/src/components/Sidebar.tsx`
- Navigation (All Notes, Smart Folders, Recently Deleted)
- Search bar with debounce (300ms)
- New note button
- Logout button

#### NoteList
**File:** `front/src/components/NoteList.tsx`
- List of note cards
- Search results display
- Loading states
- Empty states

#### NoteCard
**File:** `front/src/components/NoteCard.tsx`
- Note preview with title, snippet, timestamp
- Image thumbnail if present
- Active state styling

#### MainEditor
**File:** `front/src/components/MainEditor.tsx`
- TipTap editor wrapper
- Toolbar with formatting options
- Image upload/crop/rotate controls
- Auto-save status indicator
- Share & delete actions

#### EditorToolbar
**File:** `front/src/components/editor/EditorToolbar.tsx`
- Text formatting (bold, italic, underline, strike)
- Headings (H1, H2, H3)
- Lists (bullet, ordered, task)
- Tables
- Image insertion

#### StatusBadge
**File:** `front/src/components/editor/StatusBadge.tsx`
- Shows save status (idle, saving, saved, optimizing, cropping, rotating)
- Displays last saved time

#### ImageCropModal
**File:** `front/src/components/editor/ImageCropModal.tsx`
- React Image Crop integration
- Crop preview
- Aspect ratio controls

---

## Custom Hooks

### useAuth
**File:** `front/src/contexts/AuthContext.tsx`
- Manages JWT token state
- Cookie + localStorage persistence
- Login/logout functions
- Auto-redirect on auth failure

### useNotes
**File:** `front/src/hooks/useNotes.ts`
- `useNotes()` - Fetch all notes
- `useSearchNotes(query)` - Search notes
- `useDeletedNotes()` - Fetch deleted notes
- `useCreateNote()` - Create mutation
- `useUpdateNote()` - Update mutation with cache optimization
- `useDeleteNote()` - Soft delete mutation
- `useRestoreNote()` - Restore mutation
- `usePermanentDeleteNote()` - Hard delete mutation

### useNoteEditor
**File:** `front/src/hooks/useNoteEditor.ts`
- TipTap editor initialization
- Auto-save with 1s debounce
- Image upload handling
- Crop & rotate operations
- Save status management
- Retry logic for race conditions

### useSync
**File:** `front/src/hooks/useSync.ts`
- WebSocket connection management
- Exponential backoff reconnection
- React Query cache invalidation on WS events

---

## Image Processing (Rust WASM)

### WASM Functions
**File:** `image-wasm/src/lib.rs`

#### `resize_image(image_data, max_width)`
- Decodes JPEG/PNG/WebP
- Resizes if width > max_width (1920px default)
- Uses Lanczos3 filter for quality
- Returns raw RGBA pixels

#### `crop_image(image_data, x, y, width, height)`
- Crops region from image
- Returns raw RGBA pixels

#### `rotate_image(image_data, degrees)`
- Rotates 90°, 180°, or 270°
- Returns raw RGBA pixels

### JavaScript Integration
**File:** `front/src/lib/imageOptimizer.ts`

#### `optimizeImage(file)`
- Calls WASM resize
- Converts RGBA to WebP via Canvas
- Returns optimized File object

#### `cropImage(file, x, y, width, height)`
- Calls WASM crop
- Converts RGBA to WebP
- Returns cropped File

#### `rotateImage(file, degrees)`
- Calls WASM rotate
- Converts RGBA to WebP
- Returns rotated File

---

## Utilities

### Helper Functions
**File:** `front/src/lib/utils.ts`

- `formatRelativeTime(date)` - "2h ago", "Just now", etc.
- `stripHtml(content)` - Extract plain text from TipTap JSON
- `extractFirstImage(content)` - Get first image URL from content

### Types
**File:** `front/src/lib/types.ts`

```typescript
interface Note {
    id: string;
    title: string;
    content: JSONContent;
    createdAt: string;
    deletedAt?: string | null;
}
```

---

## WebSocket Events

### Event Types
**File:** `api/src/infrastructure/websocket.ts`

| Event | Trigger | Action |
|-------|---------|--------|
| `NOTE_CREATED` | New note created | Invalidate notes cache |
| `NOTE_UPDATED` | Note updated | Invalidate note cache |
| `NOTE_DELETED` | Note soft-deleted | Invalidate notes cache |
| `NOTE_RESTORED` | Note restored | Invalidate notes/deleted cache |
| `NOTE_PERMANENTLY_DELETED` | Note hard-deleted | Invalidate notes/deleted cache |

---

## Development Workflow

### 1. Start Database (Docker)
```bash
docker-compose up -d db
```

### 2. Initialize Database Schema
```bash
cd api
bun run db:generate
bun run db:push
```

### 3. Start API (Bun)
```bash
cd api
bun run dev
```
API available at: `http://localhost:3001`

### 4. Start Frontend (Next.js)
```bash
cd front
pnpm run dev
```
Frontend available at: `http://localhost:3000`

### 5. Database GUI
```bash
cd api
bun run drizzle-kit studio
```

---

## Environment Variables

### API (`.env.local`)
```
DATABASE_URL=postgres://user:password@localhost:5433/notesdb
JWT_SECRET=your-secret-key
PORT=3001
API_URL=http://localhost:3001
```

### Frontend (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_WS_URL=ws://localhost:3001/ws
```

---

## Key Design Patterns

### Clean Architecture
- **Domain Layer**: Pure business entities (Note, User)
- **Application Layer**: Use cases (CreateNote, LoginUser)
- **Infrastructure Layer**: Database, WebSocket implementations
- **Interface Layer**: HTTP routes, controllers

### Repository Pattern
- `INoteRepository` interface defines contract
- `DrizzleNoteRepository` implements PostgreSQL operations
- Easy to swap for different storage backends

### Auto-save with Debounce
- 1 second delay after user stops typing
- Prevents excessive API calls
- Shows "Saving..." and "Saved" status

### Optimistic Updates
- React Query cache updated immediately
- Background refetch on failure
- Smooth UX without waiting for server

### WebSocket Reconnection
- Exponential backoff (1s, 2s, 4s, 8s... max 30s)
- Automatic recovery on connection loss
- Token-based authentication

---

## Security Features

- **JWT Authentication**: 7-day token expiry
- **Password Hashing**: Bun.password.hash() (bcrypt)
- **Soft Delete**: Notes recoverable from trash
- **User Isolation**: All queries filtered by userId
- **File Upload Validation**: Type (JPEG/PNG/WebP) and size (10MB) checks
- **CORS**: Configured for cross-origin requests

---

## Future Enhancements (from Prototype.md)

- **OCR Module**: Rust/Gemini for image text extraction
- **Auto-tagging**: AI-powered tag generation
- **Semantic Linking**: Auto-link related notes
- **Vector Search**: pgvector for semantic search
- **Graph View**: Visualize note connections
- **Hybrid AI**: Local SLM (Phi-3/Llama-3) + Cloud (Gemini/Deepseek)
