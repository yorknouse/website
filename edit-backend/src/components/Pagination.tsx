"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  page: number;
  totalPages: number;
}

function createPageNumbers(
  page: number,
  totalPages: number,
  maxVisible: number = 3,
): (number | string)[] {
  const pages: (number | string)[] = [];

  const start = Math.max(2, page - maxVisible);
  const end = Math.min(totalPages - 1, page + maxVisible);

  pages.push(1);

  if (start > 2) pages.push("...");

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (end < totalPages - 1) pages.push("...");

  if (totalPages > 1) pages.push(totalPages);

  return pages;
}

export default function Pagination({ page = 1, totalPages }: PaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.set("page", newPage.toString());
    router.push(`?${params.toString()}`);
  };

  const maxVisible = 3;

  const pages = createPageNumbers(page, totalPages, maxVisible);

  return (
    <div className="flex justify-center mt-6 gap-2 py-4 px-4">
      <button
        onClick={() => handlePageChange(1)}
        disabled={page === 1}
        className="px-3 py-1 border rounded w-16 h-8 disabled:opacity-50 hover:bg-gray-100"
      >
        First
      </button>

      <button
        onClick={() => handlePageChange(page - 1)}
        disabled={page === 1}
        className="px-2 py-1 border rounded w-9 h-8 disabled:opacity-50 hover:bg-gray-100"
      >
        <ChevronLeft size={18} />
      </button>

      {pages.map((p, i) =>
        p === "..." ? (
          <span key={`ellipsis-${i}-${page}`} className="px-2 text-gray-500">
            ...
          </span>
        ) : (
          <button
            key={`page-${p}`}
            onClick={() => handlePageChange(p as number)}
            className={`px-3 py-1 rounded border min-w-8 h-8 ${
              page === p
                ? "bg-blue-600 text-white border-blue-600"
                : "border-gray-300 hover:bg-gray-100"
            }`}
          >
            {p}
          </button>
        ),
      )}

      <button
        onClick={() => handlePageChange(page + 1)}
        disabled={page === totalPages}
        className="px-2 py-1 min-w-8 h-8 border rounded disabled:opacity-50 hover:bg-gray-100"
      >
        <ChevronRight size={18} />
      </button>

      <button
        onClick={() => handlePageChange(totalPages)}
        disabled={page === totalPages}
        className="px-3 py-1 w-16 h-8 border rounded disabled:opacity-50 hover:bg-gray-100"
      >
        Last
      </button>
    </div>
  );
}
