import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  helperText?: string;
  error?: string;
  icon?: ReactNode;
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, helperText, error, icon, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">{icon}</div>}
          <input
            ref={ref}
            id={inputId}
            className={`
              w-full rounded-lg border bg-gray-800/50 px-4 py-2.5
              text-gray-100 placeholder-gray-500
              transition-all duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-offset-gray-900
              ${icon ? "pl-10" : ""}
              ${
                error
                  ? "border-discord-red focus:border-discord-red focus:ring-discord-red/30"
                  : "border-gray-700 hover:border-gray-600 focus:border-discord-blurple focus:ring-discord-blurple/30"
              }
              ${className}
            `}
            {...props}
          />
        </div>
        {(helperText ?? error) && (
          <p className={`text-xs ${error ? "text-discord-red" : "text-gray-500"}`}>{error ?? helperText}</p>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

type SelectProps = InputHTMLAttributes<HTMLSelectElement> & {
  label?: string;
  helperText?: string;
  children: ReactNode;
};

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, helperText, className = "", id, children, ...props }, ref) => {
    const selectId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="space-y-1.5">
        {label && (
          <label htmlFor={selectId} className="block text-sm font-medium text-gray-300">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={`
            w-full rounded-lg border border-gray-700 bg-gray-800/50 px-4 py-2.5
            text-gray-100
            transition-all duration-200
            hover:border-gray-600
            focus:border-discord-blurple focus:outline-none focus:ring-2 focus:ring-discord-blurple/30
            focus:ring-offset-1 focus:ring-offset-gray-900
            ${className}
          `}
          {...props}
        >
          {children}
        </select>
        {helperText && <p className="text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  },
);

Select.displayName = "Select";
