import { supabase } from "./supabase.js";

// Thin data layer over Supabase so pages stay declarative and tests can mock
// one module. Every call throws on error; RLS enforces who may do what.
function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

export async function fetchStaffProfile(userId) {
  return unwrap(await supabase.from("staff").select("*").eq("id", userId).maybeSingle());
}

export async function listStaff() {
  return unwrap(await supabase.from("staff").select("*").order("created_at"));
}

export async function updateStaff(id, changes) {
  return unwrap(await supabase.from("staff").update(changes).eq("id", id).select().single());
}

export async function listClients() {
  return unwrap(
    await supabase
      .from("clients")
      .select("*, client_domains(domain), client_products(id)")
      .order("name"),
  );
}

export async function getClient(id) {
  return unwrap(
    await supabase
      .from("clients")
      .select(
        "*, client_domains(*), client_contacts(*), client_products(*, products(id, name, slug, kind))",
      )
      .eq("id", id)
      .single(),
  );
}

export async function createClient(values) {
  return unwrap(await supabase.from("clients").insert(values).select().single());
}

export async function updateClient(id, changes) {
  return unwrap(await supabase.from("clients").update(changes).eq("id", id).select().single());
}

export async function addClientDomain(clientId, domain) {
  return unwrap(
    await supabase
      .from("client_domains")
      .insert({ client_id: clientId, domain: domain.trim().toLowerCase() })
      .select()
      .single(),
  );
}

export async function removeClientDomain(id) {
  unwrap(await supabase.from("client_domains").delete().eq("id", id));
}

export async function addContact(clientId, values) {
  return unwrap(
    await supabase.from("client_contacts").insert({ ...values, client_id: clientId }).select().single(),
  );
}

export async function removeContact(id) {
  unwrap(await supabase.from("client_contacts").delete().eq("id", id));
}

export async function addDeployment(clientId, values) {
  return unwrap(
    await supabase.from("client_products").insert({ ...values, client_id: clientId }).select().single(),
  );
}

export async function removeDeployment(id) {
  unwrap(await supabase.from("client_products").delete().eq("id", id));
}

export async function listProducts() {
  return unwrap(
    await supabase
      .from("products")
      .select("*, owner:clients!products_owner_client_id_fkey(id, name), client_products(id)")
      .order("name"),
  );
}

export async function createProduct(values) {
  return unwrap(await supabase.from("products").insert(values).select().single());
}

export async function updateProduct(id, changes) {
  return unwrap(await supabase.from("products").update(changes).eq("id", id).select().single());
}

// Postgres error codes from the migration's constraints, mapped to plain words.
export function describeError(error) {
  if (!error) return "";
  if (error.code === "23505") return "That already exists — names, slugs and domains must be unique.";
  if (error.code === "23514") return error.message?.includes("bespoke")
    ? "A bespoke product can only be deployed for the client it was built for."
    : error.message?.includes("last active admin")
      ? "There must always be at least one active admin."
      : "Some values aren't in the expected format.";
  // 42501: RLS rejected an insert. PGRST116: an update/delete matched no row
  // the user may change (RLS hides it), so .single() found nothing.
  if (error.code === "42501" || error.code === "PGRST116") return "You don't have permission to do that.";
  return error.message || "Something went wrong.";
}

// --- Tickets ---------------------------------------------------------------

const TICKET_LIST_COLUMNS =
  "id, number, subject, status, priority, channel, requester_email, requester_name, tags, " +
  "first_response_due_at, resolution_due_at, first_responded_at, solved_at, updated_at, created_at, " +
  "client:clients(id, name), assignee:staff(id, full_name, email)";

export async function listTickets({ view = "open", assigneeId, priority, clientId, search } = {}) {
  let query = supabase.from("tickets").select(TICKET_LIST_COLUMNS).order("updated_at", { ascending: false }).limit(200);
  if (view === "mine") query = query.eq("assignee_id", assigneeId).not("status", "in", "(solved,closed)");
  if (view === "unassigned") query = query.is("assignee_id", null).not("status", "in", "(solved,closed)");
  if (view === "open") query = query.not("status", "in", "(solved,closed)");
  if (view === "done") query = query.in("status", ["solved", "closed"]);
  if (priority) query = query.eq("priority", priority);
  if (clientId) query = query.eq("client_id", clientId);
  const term = search?.trim();
  if (term) {
    const number = term.replace(/^bc-/i, "");
    // Escape PostgREST filter syntax characters in free text.
    const safe = term.replace(/[%,()*\\]/g, " ");
    query = /^\d+$/.test(number)
      ? query.eq("number", Number(number))
      : query.or(`subject.ilike.*${safe}*,requester_email.ilike.*${safe}*`);
  }
  return unwrap(await query);
}

export async function getTicket(id) {
  return unwrap(
    await supabase
      .from("tickets")
      .select(
        `${TICKET_LIST_COLUMNS}, client_id, product_id, assignee_id, reply_token, last_customer_message_at, ` +
          "product:products(id, name), " +
          "ticket_messages(id, kind, author_staff_id, author_email, author_name, body_text, created_at, email_message_id), " +
          "ticket_events(id, event, from_value, to_value, actor_id, created_at)",
      )
      .eq("id", id)
      .order("created_at", { referencedTable: "ticket_messages" })
      .order("created_at", { referencedTable: "ticket_events" })
      .single(),
  );
}

export async function updateTicket(id, changes) {
  return unwrap(await supabase.from("tickets").update(changes).eq("id", id).select("id").single());
}

export async function createStaffTicket(values) {
  return unwrap(await supabase.rpc("create_staff_ticket", values).single());
}

export async function addInternalNote(ticketId, staff, body) {
  return unwrap(
    await supabase
      .from("ticket_messages")
      .insert({
        ticket_id: ticketId,
        kind: "note",
        author_staff_id: staff.id,
        author_email: staff.email,
        author_name: staff.full_name,
        body_text: body.trim(),
      })
      .select()
      .single(),
  );
}

// Customer-facing replies go through the server so they can be emailed.
export async function sendReply(ticketId, body) {
  const { data } = await supabase.auth.getSession();
  const response = await fetch("/api/tickets/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${data.session?.access_token}` },
    body: JSON.stringify({ ticket_id: ticketId, body }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "The reply couldn't be sent.");
  return result.message;
}

export async function listAssignableStaff() {
  return unwrap(
    await supabase.from("staff").select("id, full_name, email, role").eq("active", true).in("role", ["agent", "admin"]).order("full_name"),
  );
}

// --- Knowledge base / help center -----------------------------------------
// Public calls run with the publishable key as `anon`; RLS limits them to
// published, public content. Staff calls see drafts and internal articles.

const KB_LIST_COLUMNS =
  "id, type, title, slug, summary, category, tags, status, visibility, position, published_at, updated_at, product_id";

export async function listPublishedArticles(type, { productId, limit } = {}) {
  let query = supabase
    .from("kb_articles")
    .select(KB_LIST_COLUMNS)
    .eq("type", type)
    .eq("status", "published")
    .eq("visibility", "public");
  query =
    type === "update"
      ? query.order("published_at", { ascending: false })
      : query.order("category").order("position").order("title");
  if (productId) query = query.eq("product_id", productId);
  if (limit) query = query.limit(limit);
  return unwrap(await query);
}

export async function listFaqs() {
  return unwrap(
    await supabase
      .from("kb_articles")
      .select("id, title, slug, body, category, position")
      .eq("type", "faq")
      .eq("status", "published")
      .eq("visibility", "public")
      .order("category")
      .order("position"),
  );
}

export async function getPublishedArticle(slug) {
  return unwrap(
    await supabase
      .from("kb_articles")
      .select(`${KB_LIST_COLUMNS}, body`)
      .eq("slug", slug)
      .eq("status", "published")
      .eq("visibility", "public")
      .maybeSingle(),
  );
}

// Shared products only (bespoke product names stay private).
export async function listPublicProducts() {
  return unwrap(
    await supabase.from("products").select("id, name, slug, description").eq("kind", "shared").eq("active", true).order("name"),
  );
}

export async function searchKb(query, kinds = null) {
  if (!query.trim()) return [];
  return unwrap(await supabase.rpc("search_kb", { query, kinds, max_results: 20 }));
}

export async function sendArticleFeedback(articleId, helpful) {
  unwrap(await supabase.from("kb_feedback").insert({ article_id: articleId, helpful }));
}

export async function listAllArticles({ type, status, search } = {}) {
  let query = supabase
    .from("kb_articles")
    .select(`${KB_LIST_COLUMNS}, product:products(name), author:staff(full_name, email)`)
    .order("updated_at", { ascending: false });
  if (type) query = query.eq("type", type);
  if (status) query = query.eq("status", status);
  const term = search?.trim().replace(/[%,()*\\]/g, " ");
  if (term) query = query.or(`title.ilike.*${term}*,slug.ilike.*${term}*`);
  return unwrap(await query);
}

export async function getArticle(id) {
  return unwrap(await supabase.from("kb_articles").select("*").eq("id", id).single());
}

export async function saveArticle(id, values) {
  if (id) return unwrap(await supabase.from("kb_articles").update(values).eq("id", id).select().single());
  return unwrap(await supabase.from("kb_articles").insert(values).select().single());
}

export async function deleteArticle(id) {
  const { error, count } = await supabase.from("kb_articles").delete({ count: "exact" }).eq("id", id);
  if (error) throw error;
  if (!count) throw { code: "PGRST116" };
}

export async function listFeedbackTotals() {
  return unwrap(await supabase.from("kb_feedback_totals").select("*"));
}

// --- Live chat (agents) ----------------------------------------------------

const CHAT_COLUMNS =
  "id, channel_key, visitor_name, visitor_email, status, assignee_id, client_id, ticket_id, page_url, created_at, last_message_at, closed_at, " +
  "client:clients(id, name), assignee:staff(id, full_name, email), ticket:tickets(id, number)";

export async function listChats(view = "open") {
  let query = supabase.from("chat_conversations").select(CHAT_COLUMNS).order("last_message_at", { ascending: false }).limit(100);
  query = view === "closed" ? query.eq("status", "closed") : query.neq("status", "closed");
  return unwrap(await query);
}

export async function countWaitingChats() {
  const { count, error } = await supabase
    .from("chat_conversations")
    .select("id", { count: "exact", head: true })
    .eq("status", "waiting");
  if (error) throw error;
  return count ?? 0;
}

export async function getChat(id) {
  return unwrap(
    await supabase
      .from("chat_conversations")
      .select(`${CHAT_COLUMNS}, chat_messages(id, sender, author_staff_id, author_name, body, created_at)`)
      .eq("id", id)
      .order("id", { referencedTable: "chat_messages" })
      .single(),
  );
}

export async function sendAgentChatMessage(conversationId, staff, body) {
  return unwrap(
    await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        sender: "agent",
        author_staff_id: staff.id,
        author_name: staff.full_name || staff.email.split("@")[0],
        body: body.trim(),
      })
      .select()
      .single(),
  );
}

export async function updateChat(id, changes) {
  return unwrap(await supabase.from("chat_conversations").update(changes).eq("id", id).select("id").single());
}

export async function convertChatToTicket(conversationId) {
  return unwrap(await supabase.rpc("convert_chat_to_ticket", { conversation_id: conversationId }).single());
}
