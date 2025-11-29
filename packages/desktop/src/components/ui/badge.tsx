import type { ReactNode } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

type BadgeProps = {
  children: ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
  pulse?: boolean;
};

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-700/80 text-gray-300 border-gray-600",
  success: "bg-discord-green/20 text-discord-green border-discord-green/30",
  warning: "bg-discord-yellow/20 text-discord-yellow border-discord-yellow/30",
  error: "bg-discord-red/20 text-discord-red border-discord-red/30",
  info: "bg-discord-blurple/20 text-discord-blurple border-discord-blurple/30",
};

const dotStyles: Record<BadgeVariant, string> = {
  default: "bg-gray-400",
  success: "bg-discord-green",
  warning: "bg-discord-yellow",
  error: "bg-discord-red",
  info: "bg-discord-blurple",
};

export function Badge({ children, variant = "default", className = "", dot, pulse }: BadgeProps) {
  return (
    <span
      className={`
        inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5
        text-xs font-medium
        ${variantStyles[variant]}
        ${className}
      `}
    >
      {dot && (
        <span className="relative flex h-2 w-2">
          {pulse && (
            <span
              className={`absolute inline-flex h-full w-full animate-ping rounded-full opacity-75 ${dotStyles[variant]}`}
            />
          )}
          <span className={`relative inline-flex h-2 w-2 rounded-full ${dotStyles[variant]}`} />
        </span>
      )}
      {children}
    </span>
  );
}

type StatusIndicatorProps = {
  status: "connected" | "disconnected" | "connecting" | "idle" | "active" | "error";
  label?: string;
  className?: string;
};

const statusConfig: Record<StatusIndicatorProps["status"], { variant: BadgeVariant; text: string; pulse: boolean }> = {
  connected: { variant: "success", text: "Connected", pulse: false },
  disconnected: { variant: "error", text: "Disconnected", pulse: false },
  connecting: { variant: "info", text: "Connecting...", pulse: true },
  idle: { variant: "default", text: "Idle", pulse: false },
  active: { variant: "success", text: "Active", pulse: true },
  error: { variant: "error", text: "Error", pulse: false },
};

export function StatusIndicator({ status, label, className = "" }: StatusIndicatorProps) {
  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} dot pulse={config.pulse} className={className}>
      {label ?? config.text}
    </Badge>
  );
}
