export const json = (status, body, headers = {}) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store", ...headers } });

export function env(name) {
  const value = process.env[name]?.trim();
  return value || undefined;
}
