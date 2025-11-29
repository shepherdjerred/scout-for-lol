import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { Loader2 } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost" | "danger" | "success";
type ButtonSize = "sm" | "md" | "lg";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant | undefined;
  size?: ButtonSize | undefined;
  loading?: boolean | undefined;
  icon?: ReactNode | undefined;
  iconPosition?: "left" | "right" | undefined;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-discord-blurple text-white hover:bg-discord-blurple/90 focus:ring-discord-blurple/30 shadow-lg shadow-discord-blurple/20",
  secondary: "bg-gray-700 text-gray-100 hover:bg-gray-600 focus:ring-gray-500/30 border border-gray-600",
  outline:
    "bg-transparent border border-gray-600 text-gray-200 hover:bg-gray-800 hover:border-gray-500 focus:ring-gray-500/30",
  ghost: "bg-transparent text-gray-300 hover:bg-gray-800 hover:text-gray-100 focus:ring-gray-500/30",
  danger: "bg-discord-red text-white hover:bg-discord-red/90 focus:ring-discord-red/30 shadow-lg shadow-discord-red/20",
  success:
    "bg-discord-green text-white hover:bg-discord-green/90 focus:ring-discord-green/30 shadow-lg shadow-discord-green/20",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-6 py-3 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconPosition = "left",
      disabled,
      className = "",
      children,
      ...props
    },
    ref,
  ) => {
    const isDisabled = disabled ?? loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        className={`
          inline-flex items-center justify-center font-medium rounded-lg
          transition-all duration-200 ease-out
          focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900
          disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none
          ${variantStyles[variant]}
          ${sizeStyles[size]}
          ${className}
        `}
        {...props}
      >
        {loading ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          icon && iconPosition === "left" && <span className="shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === "right" && <span className="shrink-0">{icon}</span>}
      </button>
    );
  },
);

Button.displayName = "Button";
