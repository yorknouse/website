"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";

export default function SearchBar({ placeholder }: { placeholder: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Pull the existing search term from URL
  const [query, setQuery] = useState(searchParams?.get("search") || "");

  // Sync local input state with URL changes (e.g. browser back)
  useEffect(() => {
    const currentSearch = searchParams?.get("search") || "";
    if (currentSearch !== query) setQuery(currentSearch);
  }, [searchParams]);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString() || "");

    // Reset to page 1 whenever a new search is made
    if (query.trim()) {
      params.set("search", query.trim());
    } else {
      params.delete("search");
    }
    params.set("page", "1");

    router.push(`?${params.toString()}`);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative flex items-center w-full max-w-md mx-auto mb-6"
    >
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-gray-300 bg-gray-100 px-4 py-2 pl-10 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-300 outline-none transition"
      />
      <button
        type="submit"
        className="absolute left-2 text-gray-500 hover:text-blue-600 cursor-pointer"
      >
        <Search className="w-4 h-4" />
      </button>
    </form>
  );
}
