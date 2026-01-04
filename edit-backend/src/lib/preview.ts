export function validatePreviewToken(authHeader: string | null): boolean {
  if (!authHeader || authHeader.split(" ").length < 2) {
    return false;
  }

  const bearerToken = authHeader?.split(" ")[1];
  if (!bearerToken) {
    return false;
  }
  const token = process.env.DRAFT_VIEW_TOKEN;
  if (!token) {
    console.error("Draft view token missing from application!");
    return false;
  }
  return bearerToken === token;
}
