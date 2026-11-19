export type IftttEvent =
  | "socialMediaAutomationFB"
  | "socialMediaAutomationTwitter";

/** Fires the IFTTT webhook that posts an article to Facebook or Twitter. */
export async function postToIfttt(
  event: IftttEvent,
  excerpt: string,
  permalink: string,
): Promise<boolean> {
  const key = process.env.bCMS__IFTTT;
  if (!key) return false;
  try {
    const res = await fetch(
      `https://maker.ifttt.com/trigger/${event}/with/key/${key}`,
      {
        method: "POST",
        body: new URLSearchParams({
          value1: excerpt,
          value2: permalink,
          value3: "null",
        }),
      },
    );
    return res.ok;
  } catch (e) {
    console.error(`IFTTT ${event} failed`, e);
    return false;
  }
}
