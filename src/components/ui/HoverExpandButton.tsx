import { useState, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode, ComponentType } from "react";
import { cn } from "@/lib/cn";
import { LIQUID_GLASS_HOVER, TRANSITION_SPRING } from "@/lib/ui-classes";

export interface HoverExpandButtonProps {
  icon: ComponentType<{ className?: string }>;
  hoverIcon?: ComponentType<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger" | "success";
  alwaysShowLabel?: boolean;
  className?: string;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export const HoverExpandButton = forwardRef<HTMLButtonElement, HoverExpandButtonProps>(
  ({ icon: Icon, hoverIcon: HoverIcon, label, onClick, variant = "default", alwaysShowLabel, className, disabled, type = "button", ...props }, ref) => {
    const [isHovered, setIsHovered] = useState(false);

    const variantStyles = {
      default: "text-text-secondary hover:text-text-primary",
      primary: "text-accent-indigo hover:text-accent-indigo-hover",
      danger: "text-error hover:text-error/80",
      success: "text-success hover:text-success/80",
    };

    const showLabel = isHovered || alwaysShowLabel;

    return (
      <motion.button
        ref={ref}
        type={type}
        layout
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClick}
        disabled={disabled}
        className={cn(
          "flex h-10 items-center overflow-hidden rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-indigo select-none laptop:h-[36px]",
          TRANSITION_SPRING,
          variantStyles[variant],
          LIQUID_GLASS_HOVER,
          "active:scale-[0.94] active:duration-150 active:ease-out disabled:pointer-events-none disabled:opacity-50",
          className,
        )}
        style={{ paddingLeft: 8, paddingRight: showLabel ? 12 : 8 }}
        {...props}
      >
        <motion.div layout className="relative flex size-[24px] shrink-0 items-center justify-center">
          <AnimatePresence mode="popLayout">
            {isHovered && HoverIcon ? (
              <motion.div
                key="hover"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <HoverIcon className="size-[22px] stroke-[2.8]" />
              </motion.div>
            ) : (
              <motion.div
                key="default"
                initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <Icon className="size-[22px] stroke-[2.8]" />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
        <AnimatePresence>
          {showLabel && (
            <motion.span
              layout
              initial={{ opacity: 0, width: 0, marginLeft: 0 }}
              animate={{ opacity: 1, width: "auto", marginLeft: 6 }}
              exit={{ opacity: 0, width: 0, marginLeft: 0 }}
              className="whitespace-nowrap text-[12px] font-bold tracking-[-0.01em] laptop:font-medium laptop:tracking-wide"
            >
              {label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  },
);
HoverExpandButton.displayName = "HoverExpandButton";

export function GlassActionGroup({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex w-fit items-center gap-1 rounded-[15px] border border-white/60 bg-white/50 p-1 shadow-[0_4px_16px_-4px_rgba(0,0,0,0.05)] backdrop-blur-3xl laptop:rounded-[16px]", className)}>
      {children}
    </div>
  );
}
