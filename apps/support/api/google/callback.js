import { serviceClient } from "../../server/booking.js";
import { encryptToken, exchangeCode, googleConfig, googleFetch, verifyState } from "../../server/google.js";

const back = (request, outcome) =>
  Response.redirect(new URL(`/admin/availability?google=${outcome}`, request.url).toString(), 303);

// Google redirects here after consent. The signed state names the agent; the
// refresh token is encrypted before it is stored.
export async function handleCallback(request, { db, config, fetchImpl } = {}) {
  const params = new URL(request.url).searchParams;
  config ??= googleConfig();
  const client = db ?? serviceClient();
  if (!client || !config) return back(request, "unavailable");
  const staffId = verifyState(params.get("state"), config.tokenKey);
  if (!staffId) return back(request, "expired");
  if (params.get("error") || !params.get("code")) return back(request, "denied");

  let result;
  try {
    result = await exchangeCode(config, params.get("code"), fetchImpl ?? googleFetch(config));
  } catch (err) {
    console.error("Google OAuth exchange failed", { message: err.message });
    return back(request, "failed");
  }
  const now = new Date().toISOString();
  const { error } = await client.from("calendar_connections").upsert({
    staff_id: staffId,
    google_email: result.email,
    refresh_token_enc: encryptToken(result.refreshToken, config.tokenKey),
    status: "connected",
    connected_at: now,
    updated_at: now,
  });
  if (!error) await client.from("booking_agents").upsert({ staff_id: staffId }, { onConflict: "staff_id", ignoreDuplicates: true });
  return back(request, error ? "failed" : "connected");
}

export default { fetch: (request) => handleCallback(request) };
