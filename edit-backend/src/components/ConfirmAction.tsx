"use client";

import { useState, ReactNode, MouseEvent } from "react";
import { useRouter } from "next/navigation";

interface ConfirmActionProps<T = void> {
  /** Any element (button, icon, etc.) that triggers the modal */
  children: ReactNode;

  /** Optional confirmation message */
  message?: string;

  /** Optional modal title */
  title?: string;

  /** Optional callback to run on confirm */
  onConfirm?: (data?: T) => void | Promise<void>;

  /** Optional data to pass into onConfirm */
  confirmData?: T;

  /** Optional route to redirect to on confirm */
  redirectTo?: string;

  /** Optional Tailwind classes for modal buttons */
  confirmButtonClassName?: string;
  cancelButtonClassName?: string;
}

export default function ConfirmAction<T = void>({
  children,
  message = "Are you sure you want to proceed? This action cannot be undone.",
  title = "Confirm Action",
  onConfirm,
  confirmData,
  redirectTo,
  confirmButtonClassName = "bg-red-500 hover:bg-red-600 text-white",
  cancelButtonClassName = "bg-gray-100 hover:bg-gray-200 text-gray-700",
}: ConfirmActionProps<T>) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const handleConfirm = async () => {
    if (onConfirm) await onConfirm(confirmData);
    if (redirectTo) router.push(redirectTo);
    setOpen(false);
  };

  /** Close modal when clicking the backdrop (not the modal box itself) */
  const handleBackdropClick = (e: MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      setOpen(false);
    }
  };

  return (
    <>
      {/* Wrapped trigger */}
      <span onClick={() => setOpen(true)}>{children}</span>

      {/* Modal */}
      {open && (
        <div
          onClick={handleBackdropClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full animate-fadeIn">
            <h2 className="text-lg font-semibold text-gray-800 mb-2">
              {title}
            </h2>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setOpen(false)}
                className={`px-4 py-2 rounded-md transition ${cancelButtonClassName}`}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`px-4 py-2 rounded-md transition ${confirmButtonClassName}`}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
