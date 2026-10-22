import { z } from "zod";
import type { ArticleStatus } from "./status";
import { ukLocalToUtc } from "./ukTime";

const statusValues: [ArticleStatus, ...ArticleStatus[]] = [
  "draft",
  "search",
  "published",
];

const positiveInt = z.number().int().positive();

const shared = {
  headline: z
    .string()
    .trim()
    .min(1, "Headline is required")
    .max(500, "Headline must be 500 characters or fewer"),
  excerpt: z.string().max(2000).default(""),
  published: z
    .string()
    .refine(
      (v) => ukLocalToUtc(v) !== null,
      "Enter a valid publication date and time",
    ),
  status: z.enum(statusValues),
  editionId: z.number().int().nullable(),
  editionPage: z.string().max(100).default(""),
  categoryIds: z.array(positiveInt).default([]),
  authorIds: z.array(positiveInt).default([]),
  dropCap: z.boolean(),
  displayImages: z.boolean(),
  thumbnailPortrait: z.boolean(),
  postToFacebook: z.boolean(),
  postToTwitter: z.boolean(),
  socialExcerpt: z
    .string()
    .max(280, "Social excerpt must be 280 characters or fewer")
    .default(""),
  // null means unchanged on edit; on create the service defaults it to 1
  thumbnailId: positiveInt.nullable(),
  thumbnailCredit: z.string().max(500).default(""),
  // Create only; the service enforces that it is present on create
  slug: z
    .string()
    .regex(
      /^[a-z0-9_-]+$/,
      "Slug can only contain lowercase letters, numbers, - and _",
    )
    .max(255)
    .optional(),
};

export const articleSaveSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal(1),
    ...shared,
    body: z.object({ html: z.string() }),
  }),
  z.object({
    type: z.literal(6),
    ...shared,
    body: z.object({ markdown: z.string() }),
  }),
  z.object({
    type: z.literal(2),
    ...shared,
    body: z.object({
      images: z.array(
        z.object({
          id: positiveInt,
          caption: z
            .string()
            .max(500, "Caption must be 500 characters or fewer"),
        }),
      ),
    }),
  }),
  z.object({
    type: z.literal(5),
    ...shared,
    body: z.object({
      embedUrl: z.url({
        protocol: /^https?$/,
        error: "Enter a valid embed URL",
      }),
    }),
  }),
  z.object({
    type: z.literal(4),
    ...shared,
  }),
]);

export type ArticleSaveInput = z.infer<typeof articleSaveSchema>;

export type FieldErrors = Partial<Record<string, string>>;

/** First message per joined path, e.g. `body.images.0.caption`. */
export function zodToFieldErrors(err: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of err.issues) {
    const key = issue.path.map(String).join(".");
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}
