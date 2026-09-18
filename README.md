# The Author's Table, Book Launch Site

A community site for PJK's multi-book launch: readers browse the books, discuss them chapter by chapter, ask PJK questions directly, search within a chapter, and turn favourite lines into shareable images.

## Stack

- **Frontend**: Vite + React, deployed to Vercel
- **Backend**: Supabase (Postgres, Auth, Realtime, Storage, Edge Functions)
- **Email**: Resend, called from Supabase Edge Functions
- **Search**: Fuse.js, client-side, scoped to one chapter's text at a time

No custom backend server. The frontend talks to Supabase directly using the public anon key, protected by row-level security (RLS) policies described below.

## Data model

Five tables. See the full ERD at [link to data model artifact, if kept] or recreate from the schema below.

### `author`

Single row, no foreign key from anywhere. PJK is the site's only author, so this is site-wide data the app reads once, not something joined per book.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `name` | string | |
| `bio` | string | |
| `photo_url` | string | |
| `created_at` | timestamp | |

### `books`

One row per launch title.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `title` | string | |
| `blurb` | string | Short summary shown on the gallery card |
| `cover_url` | string | |
| `buy_link` | string | |
| `created_at` | timestamp | |

### `chapters`

One row per chapter, holding the full extracted text. This is what the chapter picker and the chapter-scoped search both read from.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `book_id` | uuid, FK → `books.id` | |
| `number` | int | Chapter order |
| `title` | string | |
| `content` | text | Full chapter text |
| `created_at` | timestamp | |

### `comments`

Every comment is a reply to something. This single table handles general discussion, chapter-level comments, and questions to PJK, no separate tables or mechanisms for each.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `book_id` | uuid, FK → `books.id` | |
| `chapter_id` | uuid, FK → `chapters.id`, nullable | Null if the comment is at the book level rather than a specific chapter |
| `parent_id` | uuid, FK → `comments.id`, nullable, self-referencing | Null means a top-level comment on the book/chapter; set means a reply to another comment |
| `commenter_name` | string | Free text, no accounts, so this is just whatever the reader types in |
| `content` | text | |
| `question` | boolean, default `false` | Set to `true` when the reader checks "question for PJK" |
| `reader_email` | string, nullable | Required only when `question = true`; enforced by a CHECK constraint |
| `hidden` | boolean, default `false` | Set to `true` by admin moderation. The row and its content stay in the table, but the UI renders it as "[comment removed]" so replies underneath aren't orphaned |
| `created_at` | timestamp | |

**Key design decisions:**
- Nested replies apply everywhere, not just to PJK's answers. This avoids a special case in the comment composer: "post a comment" and "reply to a comment" are the same action, just with `parent_id` set or not.
- A reply to a flagged question is a completely normal reply. The only difference is a side effect: if the parent comment has `question = true`, posting the reply triggers an email to the original reader (see Notifications, below).
- Moderation is soft-delete, never hard-delete, specifically to avoid orphaning other people's replies to a removed comment.

### `quote_cards`

Write-only from the public site. One row inserted per quote card download. Exists purely to power the admin metrics dashboard, never read by readers.

| Column | Type | Notes |
|---|---|---|
| `id` | uuid, PK | |
| `book_id` | uuid, FK → `books.id` | |
| `chapter_id` | uuid, FK → `chapters.id`, nullable | Nullable since a shared quote might not be tied to a specific chapter |
| `created_at` | timestamp | |

## Row-level security

| Table | Public read | Public insert | Public update/delete |
|---|---|---|---|
| `author` | Yes | No | No |
| `books` | Yes | No | No |
| `chapters` | Yes | No | No |
| `comments` | Yes | Yes | No. Only an authenticated admin can UPDATE, and only the `hidden` column |
| `quote_cards` | No, admin only | Yes | No |

Content for `author`, `books`, and `chapters` goes in at import time (manually, or via the PDF import script), never through the public site.

## Storage buckets

Two public Supabase Storage buckets, both provisioned via migration (`supabase/migrations/20260918005636_create_storage_buckets.sql`), not the dashboard, so the config is version-controlled:

| Bucket | Purpose | Public read | Public upload | Size limit | Allowed MIME types |
|---|---|---|---|---|---|
| `book-assets` | Book covers, PJK's author photo | Yes | No | 5 MB | `image/png`, `image/jpeg`, `image/webp` |
| `quote-backgrounds` | Quote-card background templates | Yes | No | 5 MB | `image/png`, `image/jpeg`, `image/webp` |

Both are marked `public = true`, so objects are readable at their public URL (`/storage/v1/object/public/<bucket>/<path>`) without an auth header. Uploads are a separate concern: `storage.objects` has row-level security enabled by default, and no INSERT policy is created for `anon` or `authenticated` on either bucket, so uploads are rejected for both. These are curated assets, not user-generated content, so the only way to add or replace a file is:

- Through the Supabase dashboard (Storage → bucket → Upload), or
- Via a service-role connection (e.g. a one-off script or the PDF import pipeline), never from frontend code.

## Metrics

The admin dashboard shows live counts, computed as grouped queries against `comments` and `quote_cards` on every page load. There is deliberately no separate metrics/counters table, since at this scale a stored counter is more likely to drift out of sync than to save anything meaningful in query time.

- Total comments
- Comments per book
- Total quote cards created
- Quote cards per book

## Notifications

Two Supabase Edge Functions, both calling Resend:

1. **Notify PJK**: triggered when a comment is inserted with `question = true`. Emails PJK that a new question is waiting.
2. **Notify the reader**: triggered when a reply is inserted whose parent comment has `question = true`. Looks up the parent's `reader_email` and emails that reader that PJK has replied.

If a reader's email is invalid or bounces, this fails silently for now, accepted as a launch-weekend risk rather than something worth building bounce-handling for.

If the reader still has the page open, Supabase Realtime shows the reply live regardless of whether the email successfully sends, the email exists purely as the backup channel for someone who's closed the tab.

## User journeys

1. **Discover and browse the books**: reader lands on the site, browses the gallery, reads a blurb, clicks through to a book's thread.
2. **Join the conversation**: every comment is a reply to something, either the book/chapter itself or another comment. New comments and replies appear live via Supabase Realtime.
3. **Ask PJK a question, get a reply**: reader checks "question for PJK" and provides an email. PJK is notified by email. His reply, structurally a normal reply to that comment, triggers a second email back to the reader.
4. **Search within a chapter**: reader picks a book, then a chapter, then searches that chapter's text only (via Fuse.js, entirely client-side). Search is deliberately scoped to one chapter, not the whole book.
5. **Turn a quote into a shareable image**: reader selects a quote, picks a background template, the image renders client-side via Canvas, and downloading it logs a row to `quote_cards`.
6. **Admin views site metrics**: PJK or Dayo log in via Supabase Auth and see live counts, no stored counters to maintain.
7. **Admin moderates a comment**: from the same dashboard, an inappropriate comment can be hidden (soft delete) or unhidden, without affecting any replies underneath it.

## Accepted risks for launch weekend

These were deliberate scope cuts, not oversights, revisit if the site becomes a long-running community rather than a launch-weekend feature:

- **No rate limiting** on comment or quote-card inserts.
- **No automated backups.** Supabase's free tier has zero backup retention. A manual `pg_dump` (or `supabase db dump`) script exists for on-demand snapshots, but nothing is scheduled.
- **No throttling** on how many questions one reader can flag, each one fires an email.
- **Free-tier project pausing.** Supabase pauses free projects after 7 days of inactivity, with a warning email a week ahead. Irrelevant during active launch traffic, worth knowing if the site goes quiet long-term afterward.

## Import pipeline (one-time, not part of the live app)

1. Extract text per page from each book's PDF.
2. Map PDF page index to printed page number (front matter shifts the offset, confirm per book).
3. Use each book's table of contents (chapter titles + starting page numbers) to split extracted text into per-chapter chunks.
4. Output as JSON: `{ book_title, chapter_number, chapter_title, content }`.
5. A second script reads that JSON and inserts rows into `chapters`, using the Supabase **service-role** key (never the public anon key, and never from frontend code).
