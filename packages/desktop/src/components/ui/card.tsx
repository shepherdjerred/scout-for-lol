import type { ReactNode } from "react";

type CardProps = {
  children: ReactNode;
  className?: string;
  variant?: "default" | "glass" | "bordered";
};

export function Card({ children, className = "", variant = "default" }: CardProps) {
  const variantStyles = {
    default: "bg-gray-800/80 border-gray-700/50",
    glass: "bg-gray-800/40 backdrop-blur-md border-gray-700/30",
    bordered: "bg-gray-800/60 border-gray-600",
  };

  return (
    <div
      className={`
        rounded-xl border shadow-xl
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

type CardHeaderProps = {
  children: ReactNode;
  className?: string;
  action?: ReactNode;
};

export function CardHeader({ children, className = "", action }: CardHeaderProps) {
  return (
    <div
      className={`
        flex items-center justify-between
        border-b border-gray-700/50 px-5 py-4
        ${className}
      `}
    >
      <div>{children}</div>
      {action && <div>{action}</div>}
    </div>
  );
}

type CardTitleProps = {
  children: ReactNode;
  className?: string;
  icon?: ReactNode;
};

export function CardTitle({ children, className = "", icon }: CardTitleProps) {
  return (
    <h3 className={`flex items-center gap-2 text-lg font-semibold text-gray-100 ${className}`}>
      {icon && <span className="text-discord-blurple">{icon}</span>}
      {children}
    </h3>
  );
}

type CardDescriptionProps = {
  children: ReactNode;
  className?: string;
};

export function CardDescription({ children, className = "" }: CardDescriptionProps) {
  return <p className={`mt-1 text-sm text-gray-400 ${className}`}>{children}</p>;
}

type CardContentProps = {
  children: ReactNode;
  className?: string;
};

export function CardContent({ children, className = "" }: CardContentProps) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

type CardFooterProps = {
  children: ReactNode;
  className?: string;
};

export function CardFooter({ children, className = "" }: CardFooterProps) {
  return (
    <div
      className={`
        flex items-center gap-3 border-t border-gray-700/50 px-5 py-4
        ${className}
      `}
    >
      {children}
    </div>
  );
}
