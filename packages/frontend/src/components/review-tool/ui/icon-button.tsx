/**
 * Icon Button component
 */
import type { ReactNode, ButtonHTMLAttributes } from "react";

export type IconButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  children: ReactNode;
  label: string; // For accessibility
};

export function IconButton({
  variant = "ghost",
  size = "md",
  children,
  label,
  className = "",
  ...props
}: IconButtonProps) {
  const baseStyles =
    "inline-flex items-center justify-center rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-offset-2";

  const variants = {
    primary:
      "bg-brand-500 text-white hover:bg-brand-600 hover:shadow-glow active:scale-[0.95] focus-visible:outline-brand-500",
    secondary:
      "bg-surface-100 text-surface-600 hover:bg-surface-200 active:scale-[0.95] dark:bg-surface-800 dark:text-surface-400 dark:hover:bg-surface-700",
    ghost:
      "text-surface-500 hover:bg-surface-100 hover:text-surface-700 active:scale-[0.95] dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200",
    danger: "text-defeat-500 hover:bg-defeat-50 active:scale-[0.95] dark:text-defeat-400 dark:hover:bg-defeat-900/20",
  };

  const sizes = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5",
  };

  const iconSizes = {
    sm: "[&>svg]:w-4 [&>svg]:h-4",
    md: "[&>svg]:w-5 [&>svg]:h-5",
    lg: "[&>svg]:w-6 [&>svg]:h-6",
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${iconSizes[size]} ${className}`}
      aria-label={label}
      title={label}
      {...props}
    >
      {children}
    </button>
  );
}
