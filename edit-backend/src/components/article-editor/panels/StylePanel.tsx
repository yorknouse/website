"use client";

import FieldError from "../FieldError";
import { errorId, type PanelProps } from "./types";

export default function StylePanel({ values, setField, errorFor }: PanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.dropCap}
            onChange={(e) => setField("dropCap", e.target.checked)}
            aria-describedby={errorId("dropCap")}
          />
          Drop Capital
        </label>
        <FieldError id={errorId("dropCap")} message={errorFor("dropCap")} />
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.displayImages}
            onChange={(e) => setField("displayImages", e.target.checked)}
            aria-describedby={errorId("displayImages")}
          />
          Display Images in the Article
        </label>
        <FieldError
          id={errorId("displayImages")}
          message={errorFor("displayImages")}
        />
        <p className="mt-1 text-sm italic">
          Uncheck this for articles where the legal basis for using the images
          is uncertain.{" "}
          <a
            href="https://nouse.co.uk/imageRemoval"
            target="_blank"
            rel="noreferrer"
            className="underline"
          >
            Learn more
          </a>
        </p>
      </div>
      <div>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={values.thumbnailPortrait}
            onChange={(e) => setField("thumbnailPortrait", e.target.checked)}
            aria-describedby={errorId("thumbnailPortrait")}
          />
          Is the thumbnail image in portrait orientation?
        </label>
        <FieldError
          id={errorId("thumbnailPortrait")}
          message={errorFor("thumbnailPortrait")}
        />
        <p className="mt-1 text-sm italic">
          Leave this unchecked if the article has no thumbnail
        </p>
      </div>
    </div>
  );
}
