export type SocialConfig = {
  fbWanted: boolean;
  fbPosted: boolean;
  twWanted: boolean;
  twPosted: boolean;
};

type SocialToggles = { postToFacebook: boolean; postToTwitter: boolean };

export function parseSocialConfig(raw: string): SocialConfig | null {
  const parts = raw.split(",");
  if (parts.length !== 4) return null;
  const [fbWanted, fbPosted, twWanted, twPosted] = parts.map((p) => p === "1");
  return { fbWanted, fbPosted, twWanted, twPosted };
}

export function serialiseSocialConfig(c: SocialConfig): string {
  return [c.fbWanted, c.fbPosted, c.twWanted, c.twPosted]
    .map((b) => (b ? "1" : "0"))
    .join(",");
}

export function socialConfigForCreate(t: SocialToggles): string {
  return serialiseSocialConfig({
    fbWanted: t.postToFacebook,
    fbPosted: false,
    twWanted: t.postToTwitter,
    twPosted: false,
  });
}

export function socialConfigForEdit(raw: string, t: SocialToggles): string {
  const c = parseSocialConfig(raw);
  if (!c) return raw;
  return serialiseSocialConfig({
    ...c,
    fbWanted: c.fbPosted ? c.fbWanted : t.postToFacebook,
    twWanted: c.twPosted ? c.twWanted : t.postToTwitter,
  });
}
