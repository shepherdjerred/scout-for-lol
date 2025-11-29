/**
 * Card component with variants
 */
import type { ReactNode, HTMLAttributes } from "react";

export type CardProps = HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "interactive" | "victory" | "defeat";
  padding?: "none" | "sm" | "md" | "lg";
  children: ReactNode;
};

export function Card({ variant = "default", padding = "md", children, className = "", ...props }: CardProps) {
  const variants = {
    default: "card",
    interactive: "card-interactive",
    victory: "card-victory",
    defeat: "card-defeat",
  };

  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8",
  };

  return (
    <div className={`${variants[variant]} ${paddings[padding]} ${className}`} {...props}>
      {children}
    </div>
  );
}

// Sub-components for Card structure
export function CardHeader({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLHeadingElement> & { children: ReactNode }) {
  return (
    <h3 className={`text-lg font-semibold text-surface-900 dark:text-white ${className}`} {...props}>
      {children}
    </h3>
  );
}

export function CardDescription({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLParagraphElement> & { children: ReactNode }) {
  return (
    <p className={`text-sm text-surface-500 dark:text-surface-400 mt-1 ${className}`} {...props}>
      {children}
    </p>
  );
}

export function CardContent({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={className} {...props}>
      {children}
    </div>
  );
}

export function CardFooter({
  children,
  className = "",
  ...props
}: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div className={`mt-4 pt-4 border-t border-surface-200 dark:border-surface-700 ${className}`} {...props}>
      {children}
    </div>
  );
}
