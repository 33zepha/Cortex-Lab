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
            {/* Radix gère le piège de focus, Escape et le clic à l'extérieur — pas de handler manuel. */}
            <RadixDialog.Overlay asChild forceMount>
              <motion.div
                initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
                animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
                exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-palette bg-slate-900/20"
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0, scale: 0.98, y: -16, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 0.98, y: -8, filter: "blur(4px)" }}
                transition={{
                  type: "spring",
                  stiffness: 400,
                  damping: 30,
                  mass: 0.5,
                }}
                className={cn(
                  // Dimensionné à la carte elle-même (pas plein écran) : un clic hors de cette zone
                  // doit atteindre l'Overlay en dessous pour que la fermeture "clic extérieur" de Radix marche.
                  "fixed inset-x-0 top-[15vh] z-palette mx-auto w-full max-w-xl outline-none",
                  "rounded-2xl border border-white/60 bg-white/70 backdrop-blur-3xl shadow-[0_16px_64px_rgba(0,0,0,0.12)] overflow-hidden",
                )}
              >
                <VisuallyHidden asChild>
                  <RadixDialog.Title>Palette de commandes</RadixDialog.Title>
                </VisuallyHidden>
                <Command className="w-full">
                    <div className="flex items-center gap-2.5 border-b border-black/5 px-4">
                      <MagnifyingGlassIcon className="size-5 shrink-0 text-text-muted" aria-hidden />
                      <Command.Input
                        autoFocus
                        placeholder="Rechercher une action ou une mission…"
                        className="h-14 w-full bg-transparent text-sm font-medium text-text-primary placeholder:text-text-muted/60 outline-none"
                      />
                      <kbd className="shrink-0 rounded-md border border-black/10 bg-black/5 px-2 py-0.5 font-mono text-[10px] font-medium text-text-muted">
                        ESC
                      </kbd>
                    </div>
                    <Command.List className="max-h-[350px] overflow-y-auto scrollbar-thin p-2">
                      <Command.Empty className="py-12 text-center text-sm text-text-muted">
                        Aucun résultat trouvé.
                      </Command.Empty>

                      <Command.Group heading="Missions" className="py-1.5 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-text-muted/60">
                        <Item icon={<Plus className="size-4" />} onSelect={() => run(() => navigate(ROUTES.missions))}>
                          Créer une mission
                        </Item>
                        <Item icon={<ArrowUpRight className="size-4" />} onSelect={() => run(() => navigate(ROUTES.missionDetail(missionActive.id)))}>
                          Ouvrir la mission active
                        </Item>
                        <Item icon={<FileSearch className="size-4" />} onSelect={() => run(() => navigate(ROUTES.missionDetail(missionActive.id)))}>
                          Ouvrir les preuves
                        </Item>
                        <Item icon={<XCircle className="size-4" />} onSelect={() => run(() => navigate(ROUTES.missionDetail(missionActive.id)))}>
                          Annuler la mission active
                        </Item>
                      </Command.Group>

                      <Command.Group heading="Système" className="py-1.5 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-text-muted/60">
                        <Item icon={<Activity className="size-4" />} onSelect={() => run(() => navigate(ROUTES.system))}>
                          Vérifier la santé système
                        </Item>
                      </Command.Group>

                      <Command.Group heading="Navigation" className="py-1.5 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-text-muted/60">
                        <Item icon={<LayoutGrid className="size-4" />} onSelect={() => run(() => navigate(ROUTES.home))}>
                          Aller à Overview
                        </Item>
                        <Item icon={<ListChecks className="size-4" />} onSelect={() => run(() => navigate(ROUTES.missions))}>
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
        "flex cursor-pointer items-center gap-2.5 rounded-md px-2.5 py-2.5 text-sm text-text-secondary",
        "data-[selected=true]:bg-surface-2 data-[selected=true]:text-text-primary",
      )}
    >
      <span className="text-text-muted">{icon}</span>
      {children}
    </Command.Item>
  );
}
