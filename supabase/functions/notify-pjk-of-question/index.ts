// Triggered by a Database Webhook on INSERT into public.comments.
//
// When a reader flags a comment as a question (question = true), emails
// PJK via Resend so he knows to respond. Does nothing for non-question
// inserts, which guards against the webhook ever being misconfigured to
// fire on every insert rather than a filtered one.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const PJK_EMAIL = Deno.env.get("PJK_EMAIL");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://the-authors-table.vercel.app";
// Auto-provided by the Edge Runtime for every function; not something we set.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface CommentRecord {
  id?: string;
  book_id?: string;
  chapter_id?: string | null;
  commenter_name?: string;
  content?: string;
  question?: boolean;
  reader_email?: string | null;
}

function jsonResponse(body: unknown, status: number): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function fetchBookTitle(bookId: string): Promise<string | null> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) return null;

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/books?id=eq.${encodeURIComponent(bookId)}&select=title`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0]?.title ?? null;
  } catch (err) {
    console.error("notify-pjk-of-question: failed to fetch book title", err);
    return null;
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!RESEND_API_KEY || !PJK_EMAIL) {
    console.error("notify-pjk-of-question: missing RESEND_API_KEY or PJK_EMAIL secret");
    return jsonResponse({ error: "Server misconfigured" }, 500);
  }

  let payload: unknown;
  try {
    payload = await req.json();
  } catch {
    return jsonResponse({ error: "Invalid JSON payload" }, 400);
  }

  if (!payload || typeof payload !== "object") {
    return jsonResponse({ error: "Payload missing a comment record" }, 400);
  }

  // Supabase Database Webhooks send { type, table, record, schema, old_record }.
  // Fall back to treating the payload itself as the record, so a manual test
  // can just POST the row directly without the wrapper.
  const payloadObj = payload as Record<string, unknown>;
  const record = (
    "record" in payloadObj ? payloadObj.record : payloadObj
  ) as CommentRecord | null | undefined;

  if (!record || typeof record !== "object") {
    return jsonResponse({ error: "Payload missing a comment record" }, 400);
  }

  // Not a question: nothing to do. Not an error, just a no-op guard.
  if (record.question !== true) {
    return jsonResponse({ skipped: true, reason: "question is not true" }, 200);
  }

  if (
    !isNonEmptyString(record.content) ||
    !isNonEmptyString(record.commenter_name) ||
    !isNonEmptyString(record.book_id)
  ) {
    return jsonResponse(
      { error: "Payload is missing required fields: content, commenter_name, book_id" },
      400,
    );
  }

  const bookTitle = (await fetchBookTitle(record.book_id)) ?? "their book";
  const threadUrl = `${SITE_URL}/book/${record.book_id}`;

  const subject = `New question on ${bookTitle}`;
  const text = [
    `${record.commenter_name} asked a question on "${bookTitle}":`,
    "",
    record.content,
    "",
    `Reply here: ${threadUrl}`,
  ].join("\n");
  const html = `
    <p><strong>${escapeHtml(record.commenter_name)}</strong> asked a question on <strong>${escapeHtml(bookTitle)}</strong>:</p>
    <blockquote>${escapeHtml(record.content)}</blockquote>
    <p><a href="${threadUrl}">Reply on the site</a></p>
  `;

  try {
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: RESEND_FROM_EMAIL,
        to: PJK_EMAIL,
        subject,
        text,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errorBody = await resendRes.text();
      console.error("notify-pjk-of-question: Resend API error", resendRes.status, errorBody);
      return jsonResponse({ error: "Failed to send email" }, 502);
    }

    const result = await resendRes.json();
    return jsonResponse({ sent: true, id: result.id }, 200);
  } catch (err) {
    console.error("notify-pjk-of-question: unexpected error calling Resend", err);
    return jsonResponse({ error: "Failed to send email" }, 502);
  }
});
