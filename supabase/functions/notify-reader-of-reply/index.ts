// Triggered by a Database Webhook on INSERT into public.comments.
//
// When a reply is posted to a comment that was flagged as a question
// (question = true) with a reader_email on file, emails that reader so
// they know PJK (or whoever) has responded, even if they've closed the
// tab. Realtime already shows the reply live to anyone still watching;
// this is purely the backup channel.

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const RESEND_FROM_EMAIL = Deno.env.get("RESEND_FROM_EMAIL") ?? "onboarding@resend.dev";
const SITE_URL = Deno.env.get("SITE_URL") ?? "https://the-authors-table.vercel.app";
// Auto-provided by the Edge Runtime for every function; not something we set.
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

interface CommentRecord {
  id?: string;
  book_id?: string;
  chapter_id?: string | null;
  parent_id?: string | null;
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

type ParentLookup =
  | { ok: true; parent: CommentRecord | null }
  | { ok: false; error: string };

async function fetchParentComment(parentId: string): Promise<ParentLookup> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return { ok: false, error: "Server misconfigured: missing Supabase service-role credentials" };
  }

  try {
    const res = await fetch(
      `${SUPABASE_URL}/rest/v1/comments?id=eq.${encodeURIComponent(parentId)}&select=id,question,reader_email`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      },
    );

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Supabase query failed (${res.status}): ${body}` };
    }

    const rows = await res.json();
    return { ok: true, parent: rows[0] ?? null };
  } catch (err) {
    return { ok: false, error: `Supabase query threw: ${err instanceof Error ? err.message : String(err)}` };
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  if (!RESEND_API_KEY) {
    console.error("notify-reader-of-reply: missing RESEND_API_KEY secret");
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

  // A top-level comment, not a reply: nothing to do. Not an error, just a
  // no-op guard against the webhook ever firing unfiltered.
  if (!isNonEmptyString(record.parent_id)) {
    return jsonResponse({ skipped: true, reason: "parent_id is null, not a reply" }, 200);
  }

  if (!isNonEmptyString(record.content) || !isNonEmptyString(record.book_id)) {
    return jsonResponse(
      { error: "Payload is missing required fields: content, book_id" },
      400,
    );
  }

  const lookup = await fetchParentComment(record.parent_id);
  if (!lookup.ok) {
    console.error("notify-reader-of-reply: parent lookup failed:", lookup.error);
    return jsonResponse({ error: "Failed to look up parent comment" }, 500);
  }

  if (!lookup.parent) {
    // The parent_id doesn't resolve to a real row. Log it (this usually
    // means something's off) but don't crash or error the webhook.
    console.error(
      `notify-reader-of-reply: parent_id ${record.parent_id} does not exist in comments`,
    );
    return jsonResponse({ skipped: true, reason: "parent comment not found" }, 200);
  }

  // Ordinary reply to an ordinary comment: never trigger an email.
  if (lookup.parent.question !== true || !isNonEmptyString(lookup.parent.reader_email)) {
    return jsonResponse(
      { skipped: true, reason: "parent is not a flagged question with a reader_email" },
      200,
    );
  }

  const threadUrl = `${SITE_URL}/book/${record.book_id}`;
  const subject = "PJK replied to your question";
  const text = [
    "PJK replied to the question you asked:",
    "",
    record.content,
    "",
    `See it here: ${threadUrl}`,
  ].join("\n");
  const html = `
    <p>PJK replied to the question you asked:</p>
    <blockquote>${escapeHtml(record.content)}</blockquote>
    <p><a href="${threadUrl}">See it on the site</a></p>
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
        to: lookup.parent.reader_email,
        subject,
        text,
        html,
      }),
    });

    if (!resendRes.ok) {
      const errorBody = await resendRes.text();
      // Accepted launch-weekend risk: a bounced or invalid reader_email is
      // swallowed rather than surfaced anywhere. Log it for our own
      // visibility only; the caller still gets a calm 200.
      console.error("notify-reader-of-reply: Resend API error", resendRes.status, errorBody);
      return jsonResponse({ sent: false }, 200);
    }

    const result = await resendRes.json();
    return jsonResponse({ sent: true, id: result.id }, 200);
  } catch (err) {
    console.error("notify-reader-of-reply: unexpected error calling Resend", err);
    return jsonResponse({ sent: false }, 200);
  }
});
