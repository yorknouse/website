export default function SaveStatus({
  error,
  fieldErrorCount,
  otherErrors,
  warnings,
}: {
  error: string | null;
  fieldErrorCount: number;
  /** Field errors with nowhere else on the page to show. */
  otherErrors: string[];
  warnings: string[];
}) {
  return (
    <div className="space-y-3">
      {error && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800"
        >
          {error}
        </div>
      )}
      {fieldErrorCount > 0 && (
        <div
          role="alert"
          className="rounded-md border border-red-300 bg-red-50 p-3 text-red-800"
        >
          <p className="font-semibold">
            Some fields need fixing ({fieldErrorCount})
          </p>
          {otherErrors.length > 0 && (
            <ul className="mt-1 list-disc pl-5">
              {otherErrors.map((m) => (
                <li key={m}>{m}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {warnings.length > 0 && (
        <div
          role="status"
          className="rounded-md border border-amber-300 bg-amber-50 p-3 text-amber-900"
        >
          <p className="font-semibold">Saved, but:</p>
          <ul className="mt-1 list-disc pl-5">
            {warnings.map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
