import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

type CollapsibleProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
  badge?: ReactNode;
};

export function Collapsible({ title, children, defaultOpen = false, className = "", badge }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className={`rounded-lg border border-gray-700/50 bg-gray-800/30 ${className}`}>
      <button
        type="button"
        onClick={() => {
          setIsOpen(!isOpen);
        }}
        className="flex w-full items-center justify-between px-4 py-3 text-left transition-colors hover:bg-gray-700/30"
      >
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">{title}</span>
          {badge}
        </div>
        <ChevronDown
          className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${
          isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="border-t border-gray-700/50 px-4 py-4">{children}</div>
      </div>
    </div>
  );
}
