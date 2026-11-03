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
