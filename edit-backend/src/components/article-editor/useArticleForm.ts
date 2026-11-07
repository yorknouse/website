"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  articleSaveSchema,
  zodToFieldErrors,
  type ArticleSaveInput,
  type FieldErrors,
} from "@/lib/article-editor/schema";
import type { ApiErrorBody } from "@/lib/apiErrors";
import { utcToUkLocal } from "@/lib/article-editor/ukTime";

type DistributiveOmit<T, K extends PropertyKey> = T extends unknown
  ? Omit<T, K>
  : never;

/** The save input minus `type`; `published` is a UK datetime-local string. */
export type ArticleFormValues = DistributiveOmit<ArticleSaveInput, "type">;
export type ArticleType = ArticleSaveInput["type"];
export type ArticleBody = Extract<ArticleSaveInput, { body: unknown }>["body"];
/** Fields every article type has (everything except `body`). */
export type SharedField = keyof ArticleFormValues;

export const SAVE_MESSAGES = {
  loggedOut:
    "You've been logged out. Log in again in a new tab, then press Save — your changes are still here.",
  serverError:
    "The server hit an error saving this article. Your changes are still on this page — try again, and if it keeps happening contact support@nouse.co.uk.",
  connection: "Couldn't reach the server. Check your connection and try again.",
  noSlug: "Please try again after a slug has been generated",
};

const DEFAULT_THUMBNAIL = 1;

// Verbatim from html/admin/article.twig:697, 717-718 and 741.
const CONFIRM_DEFAULT_THUMBNAIL: ConfirmRequest = {
  paragraphs: [
    "You haven't set a thumbnail for this article yet - are you sure you want to save it?",
  ],
  confirmLabel: "Yes",
  tone: "danger",
};
const CONFIRM_NO_CREDIT: ConfirmRequest = {
  paragraphs: [
    "You haven't set a credit for the thumbnail for this article yet.",
    "Please confirm that no credit is required - if you are unsure please consult a senior editor",
  ],
  confirmLabel: "No credit required",
  tone: "danger",
};
const CONFIRM_CREDIT_IN_BODY: ConfirmRequest = {
  paragraphs: [
    "Because this article is not a conventional text based article you must credit the thumbnail you have used somewhere in your article (if credit is required) as a credit will not be automatically displayed using the text entered in the credit field",
    "Please confirm that you have done this - if you are unsure please consult a senior editor",
  ],
  confirmLabel: "Thumbnail credited in body of article",
  tone: "success",
};

const CONFIRM_LEAVE: ConfirmRequest = {
  title: "Unsaved changes",
  paragraphs: ["You have unsaved changes. Leave this page and lose them?"],
  confirmLabel: "Leave",
  tone: "danger",
};

/** The in-app path a plain click on this link would navigate to, if any. */
function guardedHref(e: MouseEvent): string | null {
  if (e.defaultPrevented || e.button !== 0) return null;
  if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return null;
  const link = (e.target as Element | null)?.closest?.("a[href]");
  if (!(link instanceof HTMLAnchorElement)) return null;
  if (link.hasAttribute("download")) return null;
  if (link.target && link.target !== "_self") return null;
  const href = link.getAttribute("href") ?? "";
  if (href.startsWith("#")) return null;
  const url = new URL(link.href, window.location.href);
  if (url.origin !== window.location.origin) return null;
  const here = window.location;
  if (url.pathname === here.pathname && url.search === here.search && url.hash)
    return null;
  return url.pathname + url.search + url.hash;
}

export type ConfirmRequest = {
  /** Defaults to "Before you save". */
  title?: string;
  paragraphs: string[];
  confirmLabel: string;
  tone: "danger" | "success";
};

export type PendingConfirm = ConfirmRequest & {
  answer: (ok: boolean) => void;
};

/** Warnings from a create, shown once the browser lands on the new article. */
const warningsKey = (id: number) => `article-editor-warnings:${id}`;

export interface UseArticleFormOptions {
  mode: "create" | "edit";
  type: ArticleType;
  initial: ArticleFormValues;
  /** Set in edit mode. */
  articleId?: number;
  /** The stored thumbnail; `values.thumbnailId` null means "unchanged". */
  currentThumbnailId?: number;
}

export function useArticleForm({
  mode,
  type,
  initial,
  articleId,
  currentThumbnailId = DEFAULT_THUMBNAIL,
}: UseArticleFormOptions) {
  const router = useRouter();
  const [values, setValues] = useState<ArticleFormValues>(initial);
  const [dirty, setDirty] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [suggestedSlug, setSuggestedSlug] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<PendingConfirm | null>(null);
  const busy = useRef(false);
  // Bumped on every edit, so a save only clears "dirty" if nothing changed mid-request.
  const revision = useRef(0);

  const touch = () => {
    revision.current += 1;
    setDirty(true);
  };

  const clearErrors = (match: (key: string) => boolean) =>
    setFieldErrors((errs) => {
      const keys = Object.keys(errs).filter(match);
      if (keys.length === 0) return errs;
      const next = { ...errs };
      for (const k of keys) delete next[k];
      return next;
    });

  const setField = useCallback(
    <K extends SharedField>(key: K, value: ArticleFormValues[K]) => {
      setValues((v) => ({ ...v, [key]: value }) as ArticleFormValues);
      touch();
      clearErrors((k) => k === key);
    },
    [],
  );

  const setBody = useCallback((body: ArticleBody) => {
    setValues((v) => ({ ...v, body }) as ArticleFormValues);
    touch();
    clearErrors((k) => k === "body" || k.startsWith("body."));
  }, []);

  const markClean = useCallback(() => {
    setDirty(false);
  }, []);

  const applySuggestedSlug = () => {
    if (!suggestedSlug) return;
    setField("slug", suggestedSlug);
    setSuggestedSlug(null);
  };

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    // next/link navigates client-side, which beforeunload never sees.
    const onClick = (e: MouseEvent) => {
      const href = guardedHref(e);
      if (href === null) return;
      e.preventDefault();
      e.stopPropagation();
      setConfirm({
        ...CONFIRM_LEAVE,
        answer: (ok) => {
          setConfirm(null);
          if (ok) router.push(href);
        },
      });
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    document.addEventListener("click", onClick, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      document.removeEventListener("click", onClick, true);
    };
  }, [dirty, router]);

  useEffect(() => {
    if (articleId === undefined) return;
    try {
      const stored = sessionStorage.getItem(warningsKey(articleId));
      if (stored === null) return;
      sessionStorage.removeItem(warningsKey(articleId));
      const parsed: unknown = JSON.parse(stored);
      if (Array.isArray(parsed)) setWarnings(parsed.map(String));
    } catch {
      // Storage unavailable: the warnings were already lost, nothing to show.
    }
  }, [articleId]);

  const ask = (request: ConfirmRequest) =>
    new Promise<boolean>((resolve) => {
      setConfirm({
        ...request,
        answer: (ok) => {
          setConfirm(null);
          resolve(ok);
        },
      });
    });

  const confirmThumbnail = async (): Promise<boolean> => {
    const thumbnail = values.thumbnailId ?? currentThumbnailId;
    if (thumbnail === DEFAULT_THUMBNAIL) {
      return ask(CONFIRM_DEFAULT_THUMBNAIL);
    }
    if (values.thumbnailCredit.length < 1 && !(await ask(CONFIRM_NO_CREDIT))) {
      return false;
    }
    if (type !== 6) return ask(CONFIRM_CREDIT_IN_BODY);
    return true;
  };

  const handleResponse = async (res: Response, sentRevision: number) => {
    const isJson = (res.headers.get("content-type") ?? "").includes(
      "application/json",
    );
    // An expired session is redirected to the sign-in page, which fetch follows.
    if (res.redirected || !isJson) {
      setError(
        res.status >= 500 ? SAVE_MESSAGES.serverError : SAVE_MESSAGES.loggedOut,
      );
      return;
    }
    let body: unknown;
    try {
      body = await res.json();
    } catch {
      setError(SAVE_MESSAGES.serverError);
      return;
    }

    if (res.ok) {
      const ok = body as { articleId: number; warnings?: string[] };
      const newWarnings = ok.warnings ?? [];
      if (revision.current === sentRevision) setDirty(false);
      setWarnings(newWarnings);
      if (res.status === 201) {
        try {
          if (newWarnings.length > 0) {
            sessionStorage.setItem(
              warningsKey(ok.articleId),
              JSON.stringify(newWarnings),
            );
          }
        } catch {
          // Storage unavailable: the new page just won't repeat the warnings.
        }
        router.push(`/articles/${ok.articleId}`);
      } else {
        setSavedAt(utcToUkLocal(new Date()).slice(11));
        router.refresh();
      }
      return;
    }

    const err = (body ?? {}) as Partial<ApiErrorBody>;
    switch (res.status) {
      case 400:
      case 409: {
        const fe = err.fieldErrors ?? {};
        if (Object.keys(fe).length === 0) {
          setError(err.message ?? SAVE_MESSAGES.serverError);
        } else {
          setFieldErrors(fe);
          if (err.suggestedSlug) setSuggestedSlug(err.suggestedSlug);
        }
        return;
      }
      case 401:
        setError(SAVE_MESSAGES.loggedOut);
        return;
      case 403:
      case 404:
        setError(err.message ?? SAVE_MESSAGES.serverError);
        return;
      default:
        setError(SAVE_MESSAGES.serverError);
    }
  };

  const run = async () => {
    setError(null);
    setWarnings([]);
    setSavedAt(null);
    setSuggestedSlug(null);

    // Edit mode never sends the slug: it can't change and legacy slugs may not validate.
    const { slug, ...withoutSlug } = values;
    const payload =
      mode === "edit" ? { type, ...withoutSlug } : { type, ...values };

    const parsed = articleSaveSchema.safeParse(payload);
    const errors = parsed.success ? {} : zodToFieldErrors(parsed.error);
    if (mode === "create" && !slug) errors.slug = SAVE_MESSAGES.noSlug;
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    if (!(await confirmThumbnail())) return;

    setSaving(true);
    const sentRevision = revision.current;
    let res: Response;
    try {
      res = await fetch(
        mode === "edit"
          ? `/api/backend/articles/${articleId}`
          : "/api/backend/articles",
        {
          method: mode === "edit" ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
    } catch {
      setError(SAVE_MESSAGES.connection);
      return;
    }
    await handleResponse(res, sentRevision);
  };

  const save = async () => {
    if (busy.current) return;
    busy.current = true;
    try {
      await run();
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return {
    values,
    setField,
    setBody,
    dirty,
    markClean,
    fieldErrors,
    error,
    warnings,
    saving,
    savedAt,
    suggestedSlug,
    applySuggestedSlug,
    confirm,
    save,
  };
}
