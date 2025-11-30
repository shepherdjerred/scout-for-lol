import type { DetailedHTMLProps, TextareaHTMLAttributes } from "react";
import { cn } from "./cn.ts";

type TextareaProps = DetailedHTMLProps<TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;

export function Textarea({ className, ...props }: TextareaProps) {
  return (
    <textarea
      className={cn(
        "w-full rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white shadow-sm transition focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500",
        className,
      )}
      {...props}
    />
  );
}
