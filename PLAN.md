# WorkPlan — Personal Context Engine

## Problem Statement

Managing hundreds of daily interactions across dozens of projects leads to lost context — forgetting what was discussed, what's owed, and what to prepare for. This tool serves as a personal CRM and context engine to solve: "Before I talk to someone or walk into a meeting, what do I need to know?"

---

## Tech Stack

| Layer            | Choice                        | Notes                                                        |
| ---------------- | ----------------------------- | ------------------------------------------------------------ |
| Framework        | Next.js (App Router)          | Server components, server actions, file-based routing        |
| Database         | SQLite (v1) → PostgreSQL      | Prisma ORM — migration is a provider swap + minor type fixes |
| Auth             | Deferred (backlog)            | Not needed while running locally; add Auth.js + magic links when deploying remotely |
| UI               | shadcn/ui + Tailwind CSS      | Copy-paste components, no library lock-in                    |
| API Style        | REST                          | Route handlers in `app/api/`                                 |
| State Management | React state + server components | No extra library                                           |
| Keyword Search   | SQLite FTS5                   | Full-text keyword search across all notes/interactions       |
| Vector Search    | sqlite-vec + better-sqlite3   | Semantic similarity search; managed outside Prisma via raw SQL |
| Embeddings       | @xenova/transformers          | Local embeddings via `all-MiniLM-L6-v2` (384-dim, ~40MB, no API calls) |
| Hosting          | Local (v1)                    | Architecture should not preclude Vercel deployment           |

---

## Data Model

### Core Entities

```
Project
  - id, name, description, status, metadata (JSON)
  - archived_at (nullable — null means active)
  - created_at, updated_at

Person
  - id, name, email, role/title, organization, notes, metadata (JSON)
  - archived_at (nullable — null means active)
  - created_at, updated_at

Interaction
  - id, type (meeting | chat | in-person | other)
  - subject, date/time
  - raw_content (original pasted text — preserved for future AI processing)
  - parsed_content (structured/cleaned version)
  - metadata (JSON — flexible field for future AI-extracted data)
  - project_id (optional FK)
  - archived_at (nullable — null means active)
  - created_at, updated_at

ActionItem
  - id, description, status (open | in-progress | done | cancelled)
  - due_date (optional)
  - priority (optional)
  - interaction_id (FK — where it originated)
  - project_id (optional FK)
  - metadata (JSON)
  - archived_at (nullable — null means active)
  - created_at, updated_at

InteractionPerson (join table)
  - interaction_id, person_id

ActionItemPerson (join table)
  - action_item_id, person_id
```

### AI-Readiness Decisions (no extra work now, saves pain later)

- **`raw_content`** on interactions: preserves original text so AI can re-process as models improve
- **`metadata` (JSON)** on all core entities: avoids
- schema migrations when adding AI-extracted fields (tags, sentiment, entities, summaries)
- **Clean service layer**: note creation and processing logic in dedicated server actions / API route handlers, not scattered in components — easy to insert AI processing step later
- **Dual search from day 1**: SQLite FTS5 for keyword search + sqlite-vec for semantic similarity search. AI-generated summaries/tags automatically become searchable when added
- **Local embeddings**: `@xenova/transformers` with `all-MiniLM-L6-v2` generates 384-dim embeddings locally — no API calls, no cost, full data privacy. Embeddings are generated on interaction save and stored in a separate vector table managed via `better-sqlite3` (Prisma doesn't support vector extensions natively)
- **PostgreSQL vector migration path**: swap sqlite-vec for pgvector, update `lib/embedding-search.ts` only — components and server actions untouched

---

## v1 Core Features

### 1. Daily Dashboard
- Today's meetings with participants and project context
- Overdue and upcoming action items
- Quick-add interaction / action item

### 2. Person View
- Contact details
- Interaction history (last N conversations)
- Open action items involving this person
- Projects in common
- "What do I need to know about this person right now?"

### 3. Meeting Prep View
- Given a meeting (or upcoming interaction), show:
  - All participants and recent interaction history with each
  - Open action items related to those people and/or the project
  - Previous meetings with the same group
- Quick link from dashboard for today's meetings

### 4. Project View
- All people involved
- All interactions tagged to this project
- Open action items for the project
- Notes and decisions timeline

### 5. Interaction Capture
- Paste raw meeting notes → stored as `raw_content`
- Paste Outlook meeting invite → parse subject, date/time, attendees (text parsing, no API)
- Link to people and project
- Add action items inline during note entry

### 6. Action Items
- First-class entities with status, optional due date, linked to interaction + people + project
- List view with filters: by person, project, status, due date
- Mark complete/cancel from any view

### 7. Search (Keyword + Semantic)
- **Keyword search**: FTS5 index — exact/stemmed word matching across all interactions, notes, action items
- **Semantic search**: sqlite-vec — "find related context" even when wording differs (e.g., searching "budget" also surfaces notes about "financial review")
- Embeddings generated automatically on interaction/note save via `@xenova/transformers` (local, no API)
- Unified search UI with results from both engines, linked back to source interaction/person/project

---

## Project Structure

```
workplan/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Daily dashboard
│   ├── people/
│   │   ├── page.tsx                # People list
│   │   └── [id]/page.tsx           # Person view
│   ├── projects/
│   │   ├── page.tsx                # Projects list
│   │   └── [id]/page.tsx           # Project view
│   ├── interactions/
│   │   ├── page.tsx                # Interactions list
│   │   ├── new/page.tsx            # New interaction (paste notes/invite)
│   │   └── [id]/page.tsx           # Interaction detail
│   ├── actions/
│   │   └── page.tsx                # Action items list/filter view
│   ├── search/
│   │   └── page.tsx                # Full-text search
│   └── api/
│       ├── people/route.ts
│       ├── projects/route.ts
│       ├── interactions/route.ts
│       ├── action-items/route.ts
│       └── search/route.ts
├── components/
│   └── ui/                         # shadcn/ui components
├── lib/
│   ├── db.ts                       # Prisma client
│   ├── vector-db.ts                # better-sqlite3 + sqlite-vec client (vector tables)
│   ├── embeddings.ts               # @xenova/transformers embedding generation
│   ├── parsers/
│   │   └── outlook-invite.ts       # Parse pasted Outlook invites
│   ├── search.ts                   # FTS5 keyword search helpers
│   └── embedding-search.ts         # sqlite-vec semantic search helpers
├── prisma/
│   └── schema.prisma
├── public/
├── tailwind.config.ts
├── next.config.ts
└── package.json
```

---

## Implementation Phases

### Phase 1: Scaffold
- [x] Initialize Next.js with TypeScript, Tailwind, ESLint
- [x] Install and configure shadcn/ui
- [x] Set up Prisma with SQLite
- [x] Set up better-sqlite3 + sqlite-vec for vector tables
- [x] Set up @xenova/transformers for local embeddings
- [x] Define schema (all entities above)
- [x] Create app layout with navigation

### Phase 2: Core CRUD
- [x] People: create, list, view, edit
- [x] Projects: create, list, view, edit
- [x] Interactions: create (with paste support), list, view, edit
- [x] Action items: create, list, view, edit, status transitions
- [x] Link entities (interactions ↔ people, action items ↔ people/projects)

### Phase 2.5: Archive & Delete
- [x] Add `archivedAt` (nullable DateTime) to all entities in Prisma schema
- [x] Archive/unarchive buttons on detail pages
- [x] Filter archived items out of default list views
- [x] "Show archived" toggle on list pages
- [x] Hard delete only for archived items, with confirmation dialog
- [x] Cascade rules: deleting a person unlinks them (doesn't delete interactions)

### Phase 2.7: Portable Desktop Distribution
- [x] Configure `next.config.ts` with `output: "standalone"`
- [x] Create packaging script that bundles portable Node.js + standalone output
- [x] Build platform-specific launcher scripts (`.bat` for Windows, `.command` for Mac)
- [x] Handle native addon bundling (better-sqlite3, sqlite-vec) per platform
- [x] Cross-platform builds (Windows from Mac via prebuild-install + npm pack)
- [x] Test Mac portable bundle (54MB zip, verified working)
- [x] Test Windows portable bundle (50MB zip, built from Mac, binaries verified)
- [x] Document distribution workflow in README.md
- [x] Display version number in UI (from package.json, visible in nav)
- [x] Shutdown button in UI (standalone mode only, with confirmation)
- [x] Check GitHub releases for newer version, show banner with download link if update available
- [x] Packaging script reads version from package.json for zip naming (e.g., workplan-0.1.0-mac-arm64.zip)
- [x] Version workflow: `bash scripts/release.sh <version>` handles everything
- [x] Store database in `~/.workplan/` so upgrades find it automatically
- [x] Run `prisma migrate deploy` on startup (handles fresh install + upgrades)
- [x] Bundle prisma CLI into packaging script
- [x] Update launcher scripts to run migrations before server start
- [x] Replace custom ensureDatabase() with prisma migrate deploy
- [x] Remove DATABASE_URL from launcher scripts (app resolves it)
- [x] Update README with new data location

### Phase 3: Data Collection Enhancements

#### 3a: Smart Paste — Content Type Detection
- [x] Auto-detect pasted content type (Outlook invite, Teams meeting block, Teams chat, free-form notes)
- [x] Strip boilerplate (Teams join links, phone numbers, privacy notices, VTC info)
- [x] Store cleaned content as `parsedContent`, raw paste as `rawContent`

#### 3b: Outlook Invite Parsing
- [x] Extract subject line
- [x] Extract date/time and pre-fill form
- [x] Extract attendee list (names and/or emails)
- [x] Match attendees to existing People or offer to create new ones
- [x] Handle mixed format: invite body + embedded Teams meeting block

#### 3c: Teams Chat Parsing
- [x] Parse Teams chat copy format (preview line, sender, timestamp, message)
- [x] De-duplicate preview lines from full message text
- [x] Extract unique participants and link to People
- [x] Extract date/time range from timestamps

#### 3d: Action Item Extraction
- [x] Detect action item patterns: "Action:", "TODO:", "[ ]", "- [ ]", "@name to do X"
- [ ] Auto-create ActionItems linked to the interaction
- [ ] Link extracted action items to detected People when possible

### Phase 3.5: LLM-Powered Parsing (Local Inference Only)
- [x] Migrate `@xenova/transformers` v2 → `@huggingface/transformers` v4
- [x] Ollama integration: detect availability, extract with structured JSON output
- [x] ~~Browser-side transformers.js~~ (removed — too slow on WASM, Ollama is 100x faster)
- [x] Tiered parse flow: Ollama → regex fallback
- [x] UI indicator showing which extraction method was used (badge: "via ollama" / "via regex")

### Phase 3.7: Background AI Processing with Review Queue
- [x] Add AiJob model to Prisma schema (status, result, interactionId)
- [x] Create AiJob on interaction save (when rawContent present)
- [x] Multi-pass LLM prompts (summarize → attendees → action items)
- [x] Server-side Ollama queue (AiQueue polls, server processes via Ollama)
- [x] Nav badge showing unreviewed AI analyses count (polls every 10s)
- [x] AI suggestions card on interaction detail page
- [x] Accept/dismiss suggestions (link people, create action items)

### Phase 3.8: Topic Extraction & Grouping
- [x] Time-gap segmentation algorithm (group messages by 30min gaps / date boundaries)
- [x] Topic + InteractionTopic models in Prisma schema
- [x] Refactor Ollama code (extract shared client, fix file-size violations)
- [x] AI topic naming per segment (Ollama with date-based fallback)
- [x] Parse pipeline returns segments alongside existing fields
- [x] Interaction save creates placeholder Topics + InteractionTopics per segment
- [x] Background AI job updates Topic names and summaries
- [x] Topic CRUD API routes
- [x] Topic list and detail pages
- [x] Segment display on interaction detail page
- [x] Topics in nav sidebar

### Phase 4: Key Views (moved from Phase 3)
- [ ] Daily dashboard
- [ ] Person view (aggregated context)
- [ ] Meeting prep view
- [ ] Project view (aggregated context)

### Phase 4: Search & Polish
- [ ] SQLite FTS5 keyword search
- [ ] sqlite-vec semantic search + auto-embedding on save
- [ ] Unified search UI (keyword + semantic results)
- [ ] Outlook invite parsing
- [ ] UI polish, loading states, empty states

---

## Backlog (Future)

- [ ] **AI-assisted processing**: Paste notes → auto-extract action items, tag people/projects, generate summaries (Claude API)
- [ ] **Calendar integration**: Direct sync with Outlook/Google Calendar
- [ ] **Teams integration**: Pull chat/meeting context directly
- [ ] **Notifications**: Email reminders for upcoming meetings and overdue action items
- [ ] **Authentication**: Auth.js (NextAuth v5) with magic links via Resend — add when deploying remotely
- [ ] **Vercel deployment**: Move from local to cloud hosting
- [ ] **PostgreSQL migration**: Switch Prisma provider when ready to scale
- [ ] **Offline support / PWA**
- [ ] **Recurring meetings**: Track series and surface context across occurrences
