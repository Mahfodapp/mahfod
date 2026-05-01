/** If memo text is poetry JSON `{"sadr":"...","ajz":"..."}`, return readable lines. */
export function formatMemoBodyForDisplay(raw: string): string {
  const t = raw.trim();
  if (!t.startsWith('{')) return raw;
  try {
    const j = JSON.parse(t) as { sadr?: string; ajz?: string };
    if (typeof j?.sadr === 'string' && typeof j?.ajz === 'string') {
      return `${j.sadr}\n${j.ajz}`.trim();
    }
  } catch {
    /* not JSON */
  }
  return raw;
}
