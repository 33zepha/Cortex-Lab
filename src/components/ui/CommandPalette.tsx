import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  ArrowUpRight,
  FileSearch,
  XCircle,
  Activity,
  LayoutGrid,
  ListChecks,
  X,
} from "lucide-react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/solid";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { missionActive } from "@/fixtures/missions";

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();

  function run(action: () => void) {
    action();
    onOpenChange(false);
  }

  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <RadixDialog.Portal forceMount>
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(10px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-palette bg-slate-900/18"
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.985, y: 14, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.985, y: 8, filter: "blur(4px)" }}
                transition={{ type: "spring", stiffness: 400, damping: 32, mass: 0.55 }}
                className={cn(
                  "fixed inset-0 z-palette flex h-[100dvh] w-screen flex-col overflow-hidden border-0 bg-white/88 outline-none backdrop-blur-3xl",
                  "tablet:inset-x-0 tablet:top-[15vh] tablet:bottom-auto tablet:mx-auto tablet:h-auto tablet:w-[calc(100%-32px)] tablet:max-w-xl tablet:rounded-2xl tablet:border tablet:border-white/60 tablet:bg-white/72 tablet:shadow-[0_16px_64px_rgba(0,0,0,0.12)]",
                )}
              >
                <VisuallyHidden asChild>
                  <RadixDialog.Title>Palette de commandes</RadixDialog.Title>
                </VisuallyHidden>

                <Command className="flex min-h-0 flex-1 flex-col tablet:block">
                  <div className="flex items-center gap-3 border-b border-black/[0.06] px-4 pb-3 pt-[calc(14px+env(safe-area-inset-top))] tablet:px-4 tablet:py-0">
                    <MagnifyingGlassIcon className="size-5 shrink-0 text-text-primary/60" aria-hidden />
                    <Command.Input
                      autoFocus
                      placeholder="Rechercher une action ou une mission…"
                      className="h-12 min-w-0 flex-1 bg-transparent text-[15px] font-semibold tracking-[-0.01em] text-text-primary placeholder:font-medium placeholder:text-text-muted/55 outline-none tablet:h-14 tablet:text-sm tablet:font-medium"
                    />
                    <kbd className="hidden shrink-0 rounded-md border border-black/10 bg-black/5 px-2 py-0.5 font-mono text-[10px] font-medium text-text-muted tablet:block">
                      ESC
                    </kbd>
                    <RadixDialog.Close asChild>
                      <button
                        type="button"
                        aria-label="Fermer"
                        className="flex size-10 shrink-0 items-center justify-center rounded-[12px] border border-white/70 bg-white/60 text-text-primary shadow-[0_4px_14px_-8px_rgba(0,0,0,0.28)] active:scale-[0.94] tablet:hidden"
                      >
                        <X className="size-5" strokeWidth={3} />
                      </button>
                    </RadixDialog.Close>
                  </div>

                  <Command.List className="min-h-0 flex-1 overflow-y-auto px-3 pb-[calc(24px+env(safe-area-inset-bottom))] pt-4 scrollbar-thin tablet:max-h-[350px] tablet:p-2">
                    <Command.Empty className="py-12 text-center text-sm font-medium text-text-muted">
                      Aucun résultat trouvé.
                    </Command.Empty>

                    <Command.Group heading="Missions" className="py-2 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.13em] [&_[cmdk-group-heading]]:text-text-muted/65">
                      <Item icon={<Plus className="size-[18px]" />} onSelect={() => run(() => navigate(ROUTES.missions))}>
                        Créer une mission
                      </Item>
                      <Item icon={<ArrowUpRight className="size-[18px]" />} onSelect={() => run(() => navigate(ROUTES.missionDetail(missionActive.id)))}>
                        Ouvrir la mission active
                      </Item>
                      <Item icon={<FileSearch className="size-[18px]" />} onSelect={() => run(() => navigate(ROUTES.missionDetail(missionActive.id)))}>
                        Ouvrir les preuves
                      </Item>
                      <Item icon={<XCircle className="size-[18px]" />} onSelect={() => run(() => navigate(ROUTES.missionDetail(missionActive.id)))}>
                        Annuler la mission active
                      </Item>
                    </Command.Group>

                    <Command.Group heading="Système" className="py-2 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.13em] [&_[cmdk-group-heading]]:text-text-muted/65">
                      <Item icon={<Activity className="size-[18px]" />} onSelect={() => run(() => navigate(ROUTES.system))}>
                        Vérifier la santé système
                      </Item>
                    </Command.Group>

                    <Command.Group heading="Navigation" className="py-2 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.13em] [&_[cmdk-group-heading]]:text-text-muted/65">
                      <Item icon={<LayoutGrid className="size-[18px]" />} onSelect={() => run(() => navigate(ROUTES.home))}>
                        Aller à Overview
                      </Item>
                      <Item icon={<ListChecks className="size-[18px]" />} onSelect={() => run(() => navigate(ROUTES.missions))}>
                        Aller à Missions
                      </Item>
                    </Command.Group>
                  </Command.List>
                </Command>
              </motion.div>
            </RadixDialog.Content>
          </RadixDialog.Portal>
        )}
      </AnimatePresence>
    </RadixDialog.Root>
  );
}

function Item({
  icon,
  children,
  onSelect,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className={cn(
        "flex min-h-12 cursor-pointer items-center gap-3 rounded-[13px] px-3 py-3 text-[15px] font-semibold tracking-[-0.01em] text-text-secondary outline-none",
        "data-[selected=true]:bg-surface-2 data-[selected=true]:text-text-primary active:scale-[0.99]",
        "tablet:min-h-0 tablet:gap-2.5 tablet:rounded-md tablet:px-2.5 tablet:py-2.5 tablet:text-sm tablet:font-medium",
      )}
    >
      <span className="flex size-6 shrink-0 items-center justify-center text-text-muted [&_svg]:stroke-[2.8]">{icon}</span>
      {children}
    </Command.Item>
  );
}
