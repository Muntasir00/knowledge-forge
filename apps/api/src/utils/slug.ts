export function createSlug(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);

  const suffix = crypto.randomUUID().slice(0, 8);

  return `${normalized || "workspace"}-${suffix}`;
}
