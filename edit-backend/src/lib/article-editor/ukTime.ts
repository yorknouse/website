const TIME_ZONE = "Europe/London";

const formatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  weekday: "long",
});

const monthFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  month: "short",
});

function parts(d: Date) {
  const out: Record<string, string> = {};
  for (const p of formatter.formatToParts(d)) out[p.type] = p.value;
  return out;
}

/** YYYY-MM-DDTHH:mm:ss in London time. */
export function utcToUkLocal(d: Date): string {
  const p = parts(d);
  return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}`;
}

/** Display format matching PHP `G:i:s l j M Y`, in London time. */
export function formatUk(d: Date): string {
  const p = parts(d);
  // "Sept" in some en-GB ICU versions; PHP gives "Sep"
  const month = monthFormatter.format(d).slice(0, 3);
  return `${Number(p.hour)}:${p.minute}:${p.second} ${p.weekday} ${Number(p.day)} ${month} ${p.year}`;
}

const LOCAL_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/;

/**
 * Converts a datetime-local value typed in UK time to a UTC Date.
 * A skipped time (clocks forward) is read as GMT; an ambiguous time
 * (clocks back) resolves to the first, BST, occurrence.
 */
export function ukLocalToUtc(local: string): Date | null {
  const m = LOCAL_RE.exec(local);
  if (!m) return null;
  const [y, mo, d, h, mi, s] = m.slice(1).map((v) => (v ? Number(v) : 0));
  const asUtc = new Date(Date.UTC(y, mo - 1, d, h, mi, s));
  if (
    asUtc.getUTCFullYear() !== y ||
    asUtc.getUTCMonth() !== mo - 1 ||
    asUtc.getUTCDate() !== d ||
    asUtc.getUTCHours() !== h ||
    asUtc.getUTCMinutes() !== mi ||
    asUtc.getUTCSeconds() !== s
  ) {
    return null;
  }
  const wanted = asUtc.toISOString().slice(0, 19);
  // Try BST (+1h) first so an ambiguous time takes the earlier instant.
  for (const offsetMs of [3_600_000, 0]) {
    const candidate = new Date(asUtc.getTime() - offsetMs);
    if (utcToUkLocal(candidate) === wanted) return candidate;
  }
  return asUtc;
}
