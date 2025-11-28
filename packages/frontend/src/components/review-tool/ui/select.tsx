/**
 * Select component
 */
import type { SelectHTMLAttributes, ReactNode } from "react";

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  error?: string;
  hint?: string;
  children: ReactNode;
};

export function Select({ label, error, hint, children, className = "", id, ...props }: SelectProps) {
  const selectId = id ?? (label ? label.toLowerCase().replace(/\s+/g, "-") : undefined);

  return (
    <div className="w-full">
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-surface-700 dark:text-surface-300 mb-1.5">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`select ${error ? "border-defeat-500 focus:border-defeat-500 focus:ring-defeat-500/20" : ""} ${className}`}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="mt-1.5 text-xs text-surface-500 dark:text-surface-400">{hint}</p>}
      {error && <p className="mt-1.5 text-xs text-defeat-600 dark:text-defeat-400">{error}</p>}
    </div>
  );
}
