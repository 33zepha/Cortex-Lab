import { forwardRef, type InputHTMLAttributes } from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/cn";

export type SearchInputProps = InputHTMLAttributes<HTMLInputElement> & {
  onClear?: () => void;
};

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onClear, ...props }, ref) => {
    return (
      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-text-muted laptop:left-3 laptop:size-4" aria-hidden />
        <input
          ref={ref}
          value={value}
          className={cn(
            "h-11 w-full rounded-[12px] border border-border bg-surface-2 pl-10 pr-10 text-[16px] text-text-primary placeholder:text-text-muted laptop:h-9 laptop:rounded-md laptop:pl-9 laptop:pr-8 laptop:text-sm",
            "transition-colors duration-fast ease-standard",
            "hover:border-border-strong",
            "focus-visible:outline-none focus-visible:border-border-focus focus-visible:ring-2 focus-visible:ring-accent-indigo-muted",
            className,
          )}
          {...props}
        />
        {typeof value === "string" && value.length > 0 && onClear && (
          <button
            type="button"
            onClick={onClear}
            aria-label="Effacer la recherche"
            className="absolute right-2 top-1/2 flex size-8 -translate-y-1/2 items-center justify-center rounded-[10px] text-text-muted hover:text-text-primary laptop:right-2.5 laptop:size-auto"
          >
            <X className="size-4" strokeWidth={2.8} />
          </button>
        )}
      </div>
    );
  },
);
SearchInput.displayName = "SearchInput";
