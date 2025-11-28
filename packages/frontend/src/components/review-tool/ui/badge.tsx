/**
 * Badge component with variants
 */
import type { ReactNode, HTMLAttributes } from "react";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  variant?: "brand" | "victory" | "defeat" | "neutral";
  size?: "sm" | "md";
  children: ReactNode;
};

export function Badge({ variant = "neutral", size = "md", children, className = "", ...props }: BadgeProps) {
  const baseStyles = "inline-flex items-center gap-1 rounded-full font-medium";

  const variants = {
    brand: "bg-brand-100 text-brand-700 dark:bg-brand-900/50 dark:text-brand-300",
    victory: "bg-victory-100 text-victory-700 dark:bg-victory-900/50 dark:text-victory-300",
    defeat: "bg-defeat-100 text-defeat-700 dark:bg-defeat-900/50 dark:text-defeat-300",
    neutral: "bg-surface-100 text-surface-600 dark:bg-surface-800 dark:text-surface-400",
  };

  const sizes = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-1 text-xs",
  };

  return (
    <span className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </span>
  );
}
