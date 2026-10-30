"use client";

import { parseSocialConfig } from "@/lib/article-editor/socialConfig";
import FieldError from "../FieldError";
import { errorId, type PanelProps } from "./types";

export default function SocialPanel({
  values,
  setField,
  errorFor,
  socialConfig,
}: PanelProps & { socialConfig?: string }) {
  const posted = socialConfig ? parseSocialConfig(socialConfig) : null;
  const fbPosted = posted?.fbPosted ?? false;
  const twPosted = posted?.twPosted ?? false;

  return (
    <div className="space-y-2">
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.postToFacebook}
            disabled={fbPosted}
            onChange={(e) => setField("postToFacebook", e.target.checked)}
            aria-invalid={!!errorFor("postToFacebook")}
            aria-describedby={errorId("postToFacebook")}
          />
          {fbPosted ? "Posted" : "Post"} to Facebook
        </label>
        <FieldError
          id={errorId("postToFacebook")}
          message={errorFor("postToFacebook")}
        />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.postToTwitter}
            disabled={twPosted}
            onChange={(e) => setField("postToTwitter", e.target.checked)}
            aria-invalid={!!errorFor("postToTwitter")}
            aria-describedby={errorId("postToTwitter")}
          />
          {twPosted ? "Posted" : "Post"} to Twitter
        </label>
        <FieldError
          id={errorId("postToTwitter")}
          message={errorFor("postToTwitter")}
        />
      </div>
      <div>
        <label htmlFor="socialExcerpt" className="sr-only">
          Social media excerpt
        </label>
        <textarea
          id="socialExcerpt"
          maxLength={280}
          rows={2}
          disabled={fbPosted && twPosted}
          value={values.socialExcerpt}
          onChange={(e) => setField("socialExcerpt", e.target.value)}
          placeholder="Custom excerpt for social media display"
          aria-invalid={!!errorFor("socialExcerpt")}
          aria-describedby={errorId("socialExcerpt")}
          className="w-full resize-none rounded-md border border-gray-300 p-2 disabled:bg-gray-100"
        />
        <FieldError
          id={errorId("socialExcerpt")}
          message={errorFor("socialExcerpt")}
        />
      </div>
    </div>
  );
}
