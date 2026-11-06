/** Timezone-stable timestamp for server-rendered pages. */
export function formatTs(d: Date): string {
  return `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}
