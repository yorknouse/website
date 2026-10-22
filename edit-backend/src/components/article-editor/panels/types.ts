import type { ArticleFormValues, SharedField } from "../useArticleForm";

/** What every sidebar panel gets from the editor. */
export interface PanelProps {
  values: ArticleFormValues;
  setField: <K extends SharedField>(
    key: K,
    value: ArticleFormValues[K],
  ) => void;
  /** The error for a save field (or any of its `field.N` entries). */
  errorFor: (field: string) => string | undefined;
}

/** Id of the element holding a field's error, for `aria-describedby`. */
export const errorId = (field: string) => `${field}-error`;
