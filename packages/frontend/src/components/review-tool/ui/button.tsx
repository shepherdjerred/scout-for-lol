/**
 * Button component with variants
 */
import type { ReactNode, ButtonHTMLAttributes } from "react";

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  isLoading?: boolean;
};

export function Button({
  variant = "primary",
  size = "md",
  children,
  isLoading,
  disabled,
  className = "",
  ...props
}: ButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2";

  const variants = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-glow active:scale-[0.98] focus-visible:outline-brand-500",
    secondary:
      "bg-surface-100 text-surface-800 hover:bg-surface-200 active:scale-[0.98] dark:bg-surface-800 dark:text-surface-100 dark:hover:bg-surface-700",
    ghost:
      "bg-transparent text-surface-600 hover:bg-surface-100 active:scale-[0.98] dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200",
    danger: "bg-defeat-500 text-white hover:bg-defeat-600 hover:shadow-glow-defeat active:scale-[0.98]",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled ?? isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {children}
    </button>
  );
}
