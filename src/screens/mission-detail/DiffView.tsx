import { cn } from "@/lib/cn";

export function DiffView({ content }: { content: string }) {
  const lines = content.split("\n");
  return (
    <pre className="scrollbar-thin overflow-x-auto rounded-md border border-border bg-surface-2 p-0 font-mono text-xs leading-relaxed">
      {lines.map((line, i) => {
        const isAdd = line.startsWith("+") && !line.startsWith("+++");
        const isRemove = line.startsWith("-") && !line.startsWith("---");
        return (
          <div
            key={i}
            className={cn(
              "px-3 py-0.5",
              isAdd && "bg-success-muted text-success",
              isRemove && "bg-error-muted text-error",
              !isAdd && !isRemove && "text-text-secondary",
            )}
          >
            {line || " "}
          </div>
        );
      })}
    </pre>
  );
}
