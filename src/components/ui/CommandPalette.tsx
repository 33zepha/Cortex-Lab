import * as RadixDialog from "@radix-ui/react-dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Activity, LayoutGrid, ListChecks, X, UserRound, ArrowUpRight, Terminal } from "lucide-react";
import {
  MagnifyingGlassIcon,
  RocketLaunchIcon,
  ServerStackIcon,
  Squares2X2Icon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { cn } from "@/lib/cn";
import { ROUTES } from "@/lib/routes";
import { getMissionDisplay } from "@/lib/mission-naming";
import { useMissions } from "@/lib/useMissions";
import type { Mission } from "@/lib/types";

export type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

const statusLabel: Record<Mission["status"], string> = {
  running: "En cours",
  needs_review: "Revue",
  completed: "Terminée",
  failed: "Échec",
  cancelled: "Annulée",
};

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const navigate = useNavigate();
  const { missions } = useMissions();

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
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18 }}
                className="fixed inset-0 z-palette bg-slate-950/14 backdrop-blur-[10px]"
              />
            </RadixDialog.Overlay>

            <RadixDialog.Content asChild forceMount>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.18, ease: [0.2, 0.8, 0.2, 1] }}
                className={cn(
                  "fixed inset-0 z-palette flex min-h-0 w-screen flex-col overflow-hidden bg-background outline-none",
                  "tablet:inset-x-0 tablet:bottom-auto tablet:top-[14vh] tablet:mx-auto tablet:h-auto tablet:w-[calc(100%-40px)] tablet:max-w-[620px] tablet:rounded-[26px] tablet:border tablet:border-white/70 tablet:bg-white/78 tablet:shadow-[0_24px_90px_-28px_rgba(0,0,0,0.3)] tablet:backdrop-blur-3xl",
                )}
              >
                <VisuallyHidden asChild>
                  <RadixDialog.Title>Recherche Cortex</RadixDialog.Title>
                </VisuallyHidden>

                <Command className="flex min-h-0 flex-1 flex-col bg-transparent">
                  <div
                    className="relative shrink-0 border-b border-black/[0.055] tablet:px-5 tablet:pt-5"
                    style={{
                      paddingTop: "max(16px, env(safe-area-inset-top))",
                      paddingLeft: "var(--mobile-gutter)",
                      paddingRight: "var(--mobile-gutter)",
                    }}
                  >
                    <div className="relative mb-4 flex items-center justify-between tablet:mb-4">
                      <div className="relative py-2">
                        <MagnifyingGlassIcon
                          className="pointer-events-none absolute -left-1 -top-2 size-[66px] -rotate-6 text-text-primary opacity-[0.045] tablet:hidden"
                          aria-hidden
                        />
                        <p className="relative z-10 text-[28px] font-bold leading-none tracking-[-0.045em] text-text-primary tablet:text-xl tablet:font-semibold tablet:tracking-tight">
                          Recherche
                        </p>
                      </div>

                      <RadixDialog.Close asChild>
                        <button
                          type="button"
                          aria-label="Fermer la recherche"
                          className="flex size-11 items-center justify-center rounded-[14px] border border-white/75 bg-white/58 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_5px_18px_-10px_rgba(0,0,0,0.28)] backdrop-blur-2xl active:opacity-75 tablet:size-10"
                        >
                          <X className="size-5" strokeWidth={3.2} />
                        </button>
                      </RadixDialog.Close>
                    </div>

                    <div className="mb-4 flex min-h-13 items-center gap-3 rounded-[17px] border border-white/75 bg-white/68 px-4 shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_-16px_rgba(0,0,0,0.35)] backdrop-blur-2xl tablet:mb-5">
                      <MagnifyingGlassIcon className="size-[20px] shrink-0 text-text-primary/65" aria-hidden />
                      <Command.Input
                        autoFocus
                        autoComplete="off"
                        inputMode="search"
                        enterKeyHint="search"
                        spellCheck={false}
                        placeholder="Missions, écrans, actions…"
                        className="h-13 min-w-0 flex-1 bg-transparent text-[16px] font-semibold tracking-[-0.015em] text-text-primary placeholder:font-medium placeholder:text-text-muted/55 outline-none tablet:text-[15px]"
                      />
                      <kbd className="hidden rounded-[8px] border border-black/[0.07] bg-black/[0.035] px-2 py-1 font-mono text-[9px] font-semibold text-text-muted tablet:block">
                        ESC
                      </kbd>
                    </div>
                  </div>

                  <Command.List
                    className="min-h-0 flex-1 overscroll-contain overflow-y-auto pt-4 scrollbar-none tablet:max-h-[430px] tablet:px-3 tablet:pb-3"
                    style={{
                      paddingLeft: "var(--mobile-gutter)",
                      paddingRight: "var(--mobile-gutter)",
                      paddingBottom: "calc(28px + env(safe-area-inset-bottom))",
                    }}
                  >
                    <Command.Empty className="py-14 text-center text-[13px] font-semibold text-text-muted">
                      Aucun résultat dans Cortex.
                    </Command.Empty>

                    <Command.Group
                      heading="Navigation"
                      className="mb-4 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.13em] [&_[cmdk-group-heading]]:text-text-muted"
                    >
                      <SearchItem icon={<Squares2X2Icon className="size-[19px]" />} onSelect={() => run(() => navigate(ROUTES.home))} value="overview accueil dashboard">
                        <div>
                          <p className="font-bold text-text-primary">Overview</p>
                          <p className="mt-0.5 text-[11px] font-medium text-text-muted">Cockpit général</p>
                        </div>
                      </SearchItem>
                      <SearchItem icon={<RocketLaunchIcon className="size-[19px]" />} onSelect={() => run(() => navigate(ROUTES.missions))} value="missions exécutions agents">
                        <div>
                          <p className="font-bold text-text-primary">Missions</p>
                          <p className="mt-0.5 text-[11px] font-medium text-text-muted">Exécutions et historique</p>
                        </div>
                      </SearchItem>
                      <SearchItem icon={<Terminal className="size-[19px]" />} onSelect={() => run(() => navigate(ROUTES.console))} value="console logs terminal runtime streaming cortex claude">
                        <div>
                          <p className="font-bold text-text-primary">Console</p>
                          <p className="mt-0.5 text-[11px] font-medium text-text-muted">Flux temps réel et logs runtime</p>
                        </div>
                      </SearchItem>
                      <SearchItem icon={<ServerStackIcon className="size-[19px]" />} onSelect={() => run(() => navigate(ROUTES.system))} value="system système serveur santé vps">
                        <div>
                          <p className="font-bold text-text-primary">System</p>
                          <p className="mt-0.5 text-[11px] font-medium text-text-muted">Infrastructure et moteurs</p>
                        </div>
                      </SearchItem>
                      <SearchItem icon={<UserIcon className="size-[19px]" />} onSelect={() => run(() => navigate(ROUTES.profile))} value="profil profile opérateur compte">
                        <div>
                          <p className="font-bold text-text-primary">Profil</p>
                          <p className="mt-0.5 text-[11px] font-medium text-text-muted">Identité locale Cortex</p>
                        </div>
                      </SearchItem>
                    </Command.Group>

                    {missions && missions.length > 0 && (
                      <Command.Group
                        heading="Missions"
                        className="mb-4 [&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.13em] [&_[cmdk-group-heading]]:text-text-muted"
                      >
                        {missions.slice(0, 8).map((mission) => {
                          const display = getMissionDisplay(mission, { preset: "row" });
                          return (
                            <SearchItem
                              key={mission.id}
                              icon={<ArrowUpRight className="size-[18px]" strokeWidth={3} />}
                              onSelect={() => run(() => navigate(ROUTES.missionDetail(mission.id)))}
                              value={`${display.title} ${mission.objective} ${mission.model} ${statusLabel[mission.status]}`}
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-bold text-text-primary">{display.title}</p>
                                <p className="mt-0.5 truncate text-[11px] font-medium text-text-muted">
                                  {statusLabel[mission.status]} · {mission.model}
                                </p>
                              </div>
                            </SearchItem>
                          );
                        })}
                      </Command.Group>
                    )}

                    <Command.Group
                      heading="Accès rapide"
                      className="[&_[cmdk-group-heading]]:mb-2 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[0.13em] [&_[cmdk-group-heading]]:text-text-muted"
                    >
                      <SearchItem icon={<LayoutGrid className="size-[18px]" strokeWidth={2.8} />} onSelect={() => run(() => navigate(ROUTES.home))} value="dashboard overview">
                        Ouvrir le cockpit
                      </SearchItem>
                      <SearchItem icon={<ListChecks className="size-[18px]" strokeWidth={2.8} />} onSelect={() => run(() => navigate(ROUTES.missions))} value="liste missions">
                        Parcourir toutes les missions
                      </SearchItem>
                      <SearchItem icon={<Activity className="size-[18px]" strokeWidth={2.8} />} onSelect={() => run(() => navigate(ROUTES.system))} value="santé system serveur">
                        Vérifier le système
                      </SearchItem>
                      <SearchItem icon={<UserRound className="size-[18px]" strokeWidth={2.8} />} onSelect={() => run(() => navigate(ROUTES.profile))} value="profil opérateur">
                        Ouvrir le profil opérateur
                      </SearchItem>
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

function SearchItem({
  icon,
  children,
  onSelect,
  value,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
  onSelect: () => void;
  value: string;
}) {
  return (
    <Command.Item
      value={value}
      onSelect={onSelect}
      className={cn(
        "group mb-1 flex min-h-[58px] cursor-pointer items-center gap-3 rounded-[16px] border border-transparent px-3 py-2.5 text-[14px] font-semibold tracking-[-0.01em] text-text-secondary outline-none",
        "data-[selected=true]:border-white/70 data-[selected=true]:bg-white/64 data-[selected=true]:shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_5px_18px_-13px_rgba(0,0,0,0.28)]",
        "active:opacity-75 tablet:min-h-[52px] tablet:rounded-[13px] tablet:px-3",
      )}
    >
      <span className="flex size-9 shrink-0 items-center justify-center rounded-[12px] border border-white/65 bg-white/52 text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,0.95),0_3px_10px_-8px_rgba(0,0,0,0.28)] [&_svg]:stroke-[2.8]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </Command.Item>
  );
}
