/**
 * Input component
 */
import type { InputHTMLAttributes } from "react";

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  hint?: string;
};

export function Input({ label, error, hint, className = "", id, ...props }: InputProps) {
  const inputId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`input ${error ? "border-defeat-500 focus:border-defeat-500 focus:ring-defeat-500/20" : ""} ${className}`}
        {...props}
      />
      {hint && !error && <p className="mt-1.5 text-xs text-surface-500 dark:text-surface-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-defeat-600 dark:text-defeat-400">{error}</p>}
    </div>
  );
}
