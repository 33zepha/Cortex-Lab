import { useRef, type PointerEvent as ReactPointerEvent, type ReactNode } from "react";
import { motion, type HTMLMotionProps } from "framer-motion";
import { cn } from "@/lib/cn";
import "@/styles/liquid-surface.css";

type LiquidVariant = "core" | "wing" | "control" | "popover";

type LiquidSurfaceProps = Omit<HTMLMotionProps<"div">, "children"> & {
  variant?: LiquidVariant;
  interactive?: boolean;
  sheen?: boolean;
  children?: ReactNode;
};

type LiquidButtonProps = Omit<HTMLMotionProps<"button">, "children"> & {
  variant?: Exclude<LiquidVariant, "popover">;
  sheen?: boolean;
  children?: ReactNode;
};

function setLight(event: ReactPointerEvent<HTMLElement>, node: HTMLElement | null) {
  if (!node || event.pointerType === "touch") return;
  const rect = node.getBoundingClientRect();
  node.style.setProperty("--liquid-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
  node.style.setProperty("--liquid-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
  node.style.setProperty("--liquid-alpha", "1");
}

function clearLight(node: HTMLElement | null) {
  node?.style.setProperty("--liquid-alpha", "0");
}

export function LiquidSurface({
  variant = "core",
  interactive = false,
  sheen = true,
  className,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: LiquidSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);

  return (
    <motion.div
      ref={ref}
      data-liquid-variant={variant}
      data-liquid-interactive={interactive || undefined}
      className={cn("liquid-surface", className)}
      onPointerMove={(event) => {
        setLight(event, ref.current);
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        clearLight(ref.current);
        onPointerLeave?.(event);
      }}
      {...props}
    >
      {sheen && <span className="liquid-surface__specular" aria-hidden />}
      <span className="liquid-surface__edge" aria-hidden />
      <div className="liquid-surface__content">{children}</div>
    </motion.div>
  );
}

export function LiquidButton({
  variant = "control",
  sheen = true,
  className,
  children,
  onPointerMove,
  onPointerLeave,
  ...props
}: LiquidButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);

  return (
    <motion.button
      ref={ref}
      data-liquid-variant={variant}
      data-liquid-interactive="true"
      className={cn("liquid-surface liquid-button", className)}
      onPointerMove={(event) => {
        setLight(event, ref.current);
        onPointerMove?.(event);
      }}
      onPointerLeave={(event) => {
        clearLight(ref.current);
        onPointerLeave?.(event);
      }}
      {...props}
    >
      {sheen && <span className="liquid-surface__specular" aria-hidden />}
      <span className="liquid-surface__edge" aria-hidden />
      <span className="liquid-surface__content">{children}</span>
    </motion.button>
  );
}
