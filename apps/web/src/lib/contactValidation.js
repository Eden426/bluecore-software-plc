export const CONTACT_LIMITS = { name: 100, email: 254, company: 200, message: 5000, website: 200 };
export function isEmail(value) {
  if (typeof value !== "string" || value.length > 254) return false;
  if (!/^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/.test(value)) return false;
  const [local, domain] = value.split("@");
  return local.length <= 64 && !local.startsWith(".") && !local.endsWith(".") && !local.includes("..") && domain.split(".").every(label => label.length <= 63);
}
const hasControls = (value, multiline = false) => [...value].some((char) => {
  const code = char.charCodeAt(0);
  return code === 127 || (code < 32 && !(multiline && [9, 10, 13].includes(code)));
});

export function validateContact(form) {
  const errors = {};
  if (typeof form.name !== "string" || form.name.trim().length < 2 || form.name.length > CONTACT_LIMITS.name || hasControls(form.name)) errors.name = "Please enter a name between 2 and 100 characters.";
  if (typeof form.email !== "string" || form.email.length > CONTACT_LIMITS.email || !isEmail(form.email.trim())) errors.email = "Please enter a valid email address (up to 254 characters).";
  if (typeof form.company !== "string" || form.company.length > CONTACT_LIMITS.company || hasControls(form.company)) errors.company = "Company must be at most 200 characters on one line.";
  if (typeof form.message !== "string" || form.message.trim().length < 10 || form.message.length > CONTACT_LIMITS.message || hasControls(form.message, true)) errors.message = "Please enter a message between 10 and 5,000 characters.";
  return errors;
}
