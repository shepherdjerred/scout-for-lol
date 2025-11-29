import type { ReactNode, HTMLAttributes } from "react";
import * as CollapsiblePrimitive from "@radix-ui/react-collapsible";
import { ChevronDown } from "lucide-react";
import { cn } from "@scout-for-lol/desktop/lib/utils";

type CollapsibleProps = HTMLAttributes<HTMLDivElement> & {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  badge?: ReactNode;
};

function Collapsible({
  title,
  children,
  defaultOpen = false,
  className,
  badge,
  ...props
}: CollapsibleProps) {
  return (
    <CollapsiblePrimitive.Root defaultOpen={defaultOpen}>
      <div
        className={cn(
          "rounded-xl border border-gray-700/50 bg-gray-800/30",
          className
        )}
        {...props}
      >
        <CollapsiblePrimitive.Trigger asChild>
          <button
            type="button"
            className="flex w-full items-center justify-between px-5 py-4 text-left transition-colors hover:bg-gray-700/30 rounded-t-xl group"
          >
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-200">{title}</span>
              {badge}
            </div>
            <ChevronDown className="h-4 w-4 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
          </button>
        </CollapsiblePrimitive.Trigger>
        <CollapsiblePrimitive.Content className="overflow-hidden data-[state=closed]:animate-collapsible-up data-[state=open]:animate-collapsible-down">
          <div className="border-t border-gray-700/50 px-5 py-5">{children}</div>
        </CollapsiblePrimitive.Content>
      </div>
    </CollapsiblePrimitive.Root>
  );
}

export { Collapsible };
