import type { ReactNode } from "react";
import { AlertCircle, CheckCircle2, Info, XCircle, Loader2 } from "lucide-react";

type AlertVariant = "info" | "success" | "warning" | "error" | "loading";

type AlertProps = {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
  title?: string;
  onDismiss?: () => void;
};

const variantStyles: Record<AlertVariant, string> = {
  info: "bg-discord-blurple/10 border-discord-blurple/30 text-discord-blurple",
  success: "bg-discord-green/10 border-discord-green/30 text-discord-green",
  warning: "bg-discord-yellow/10 border-discord-yellow/30 text-discord-yellow",
  error: "bg-discord-red/10 border-discord-red/30 text-discord-red",
  loading: "bg-discord-blurple/10 border-discord-blurple/30 text-discord-blurple",
};

const icons: Record<AlertVariant, ReactNode> = {
  info: <Info className="h-5 w-5" />,
  success: <CheckCircle2 className="h-5 w-5" />,
  warning: <AlertCircle className="h-5 w-5" />,
  error: <XCircle className="h-5 w-5" />,
  loading: <Loader2 className="h-5 w-5 animate-spin" />,
};

export function Alert({ children, variant = "info", className = "", title, onDismiss }: AlertProps) {
  return (
    <div
      className={`
        flex items-start gap-3 rounded-lg border p-4 animate-fade-in
        ${variantStyles[variant]}
        ${className}
      `}
      role="alert"
    >
      <span className="shrink-0 mt-0.5">{icons[variant]}</span>
      <div className="flex-1 min-w-0">
        {title && <p className="font-medium mb-1">{title}</p>}
        <p className="text-sm opacity-90">{children}</p>
      </div>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 p-1 rounded hover:bg-white/10 transition-colors"
          aria-label="Dismiss"
        >
          <XCircle className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}
