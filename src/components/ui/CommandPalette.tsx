import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  ArrowUpRight,
  FileSearch,
  XCircle,
  Activity,
  LayoutGrid,
  ListChecks,
} from "lucide-react";
import { cn } from "@/lib/cn";
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
    <>
      {open && (
        <div className="fixed inset-0 z-dialog animate-fade-in bg-text-primary/10 backdrop-blur-[2px]" aria-hidden />
      )}
      <Command.Dialog
        open={open}
        onOpenChange={onOpenChange}
        label="Palette de commandes Cortex"
        className={cn(
          "fixed left-1/2 top-[18%] z-palette w-full max-w-xl -translate-x-1/2",
          "rounded-xl border border-border-strong bg-surface-1 shadow-lg overflow-hidden",
          "animate-slide-up",
        )}
      >
      <div className="flex items-center gap-2.5 border-b border-border px-4">
        <Search className="size-4 shrink-0 text-text-muted" aria-hidden />
        <Command.Input
          autoFocus
          placeholder="Rechercher une action ou une mission…"
          className="h-12 w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted outline-none"
        />
        <kbd className="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-text-muted">
          esc
        </kbd>
      </div>
      <Command.List className="max-h-80 overflow-y-auto scrollbar-thin p-2">
        <Command.Empty className="py-8 text-center text-sm text-text-muted">
          Aucun résultat.
        </Command.Empty>

        <Command.Group heading="Missions" className="py-1.5 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-items]]:mt-1.5">
          <Item icon={<Plus className="size-4" />} onSelect={() => run(() => navigate("/missions"))}>
            Créer une mission
          </Item>
          <Item icon={<ArrowUpRight className="size-4" />} onSelect={() => run(() => navigate(`/missions/${missionActive.id}`))}>
            Ouvrir la mission active
          </Item>
          <Item icon={<FileSearch className="size-4" />} onSelect={() => run(() => navigate(`/missions/${missionActive.id}`))}>
            Ouvrir les preuves
          </Item>
          <Item icon={<XCircle className="size-4" />} onSelect={() => run(() => navigate(`/missions/${missionActive.id}`))}>
            Annuler la mission active
          </Item>
        </Command.Group>

        <Command.Group heading="Système" className="py-1.5 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-items]]:mt-1.5">
          <Item icon={<Activity className="size-4" />} onSelect={() => run(() => navigate("/system"))}>
            Vérifier la santé système
          </Item>
        </Command.Group>

        <Command.Group heading="Navigation" className="py-1.5 [&_[cmdk-group-heading]]:block [&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:text-xs [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wide [&_[cmdk-group-heading]]:text-text-muted [&_[cmdk-group-items]]:mt-1.5">
          <Item icon={<LayoutGrid className="size-4" />} onSelect={() => run(() => navigate("/"))}>
            Aller à Overview
          </Item>
          <Item icon={<ListChecks className="size-4" />} onSelect={() => run(() => navigate("/missions"))}>
            Aller à Missions
          </Item>
        </Command.Group>
      </Command.List>
      </Command.Dialog>
    </>
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
