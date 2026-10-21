"use client";

import { useEffect, useState } from "react";

type Author = {
  id: number;
  name: string;
};

type AuthorMultiSelectProps = {
  value?: Author[];
  onChange: (authorIds: number[]) => void;
};

export default function AuthorMultiSelect({
  value,
  onChange,
}: AuthorMultiSelectProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Author[]>([]);
  const [selected, setSelected] = useState<Author[]>(value || []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!query) return;

      fetch(`/api/authors/search?q=${encodeURIComponent(query)}`)
        .then(res => res.json())
        .then(data => setResults(data));
    }, 300);

    return () => clearTimeout(timeout);
  }, [query]);

  function addAuthor(author: Author) {
    if (selected.find(a => a.id === author.id)) return;

    const updated = [...selected, author];
    setSelected(updated);
    onChange(updated.map(a => a.id));
    setQuery("");
    setResults([]);
  }

  function removeAuthor(id: number) {
    const updated = selected.filter(a => a.id !== id);
    setSelected(updated);
    onChange(updated.map(a => a.id));
  }

  return (
    <div className="border rounded p-2">
      {/* Selected pills */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selected.map(author => (
          <div
            key={author.id}
            className="bg-gray-200 px-2 py-1 rounded flex items-center gap-2"
          >
            {author.name}
            <button
              type="button"
              onClick={() => removeAuthor(author.id)}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {/* Input */}
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search authors..."
        className="w-full outline-none"
      />

      {/* Dropdown */}
      {results.length > 0 && (
        <div className="border mt-1 rounded bg-white shadow">
          {results.map(author => (
            <div
              key={author.id}
              onClick={() => addAuthor(author)}
              className="p-2 hover:bg-gray-100 cursor-pointer"
            >
              {author.name}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}