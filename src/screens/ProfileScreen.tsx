import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { UserIcon } from "@heroicons/react/24/solid";
import { Fingerprint, MonitorCog, ShieldCheck, UserRound, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/shell/PageHeader";
import { BentoCard, Input } from "@/components/ui";
import { EASE_SPRING_ARRAY } from "@/lib/animations";

const PROFILE_STORAGE_KEY = "cortex.operator-profile";

type LocalProfile = {
  displayName: string;
  role: string;
};

const DEFAULT_PROFILE: LocalProfile = {
  displayName: "Opérateur",
  role: "Pilote Cortex",
};

function readLocalProfile(): LocalProfile {
  if (typeof window === "undefined") return DEFAULT_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    const parsed = JSON.parse(raw) as Partial<LocalProfile>;
    return {
      displayName: parsed.displayName?.trim() || DEFAULT_PROFILE.displayName,
      role: parsed.role?.trim() || DEFAULT_PROFILE.role,
    };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export function ProfileScreen() {
  const initial = useMemo(() => readLocalProfile(), []);
  const [displayName, setDisplayName] = useState(initial.displayName);
  const [role, setRole] = useState(initial.role);
  const [saved, setSaved] = useState(false);

  const initials = useMemo(() => {
    const words = displayName.trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return "C";
    return words.slice(0, 2).map((word) => word[0]?.toUpperCase()).join("");
  }, [displayName]);

  function saveProfile() {
    const next: LocalProfile = {
      displayName: displayName.trim() || DEFAULT_PROFILE.displayName,
      role: role.trim() || DEFAULT_PROFILE.role,
    };
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(next));
    setDisplayName(next.displayName);
    setRole(next.role);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 1800);
  }

  function resetProfile() {
    window.localStorage.removeItem(PROFILE_STORAGE_KEY);
    setDisplayName(DEFAULT_PROFILE.displayName);
    setRole(DEFAULT_PROFILE.role);
    setSaved(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE_SPRING_ARRAY }}
    >
      <PageHeader title="Profil" icon={UserIcon} />

      <div className="space-y-5 laptop:space-y-7">
        <section>
          <div className="mb-2.5 flex items-end justify-between gap-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-primary">Identité locale</h2>
            <span className="text-[10px] font-semibold text-text-muted">Cet appareil</span>
          </div>

          <BentoCard className="overflow-hidden" padding="none">
            <div className="p-4 laptop:p-6">
              <div className="flex items-center gap-4">
                <div className="flex size-16 shrink-0 items-center justify-center rounded-[20px] border border-white/75 bg-white/62 text-[22px] font-bold tracking-[-0.04em] text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_8px_24px_-15px_rgba(0,0,0,0.35)]">
                  {initials}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[21px] font-bold leading-tight tracking-[-0.035em] text-text-primary">{displayName || DEFAULT_PROFILE.displayName}</p>
                  <p className="mt-1 text-[12px] font-semibold text-text-muted">{role || DEFAULT_PROFILE.role}</p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 tablet:grid-cols-2">
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">Nom affiché</span>
                  <Input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Opérateur" />
                </label>
                <label className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-text-muted">Rôle</span>
                  <Input value={role} onChange={(event) => setRole(event.target.value)} placeholder="Pilote Cortex" />
                </label>
              </div>

              <div className="mt-5 flex items-center justify-between gap-3 border-t border-black/[0.05] pt-4">
                <button
                  type="button"
                  onClick={resetProfile}
                  className="flex min-h-11 items-center gap-2 rounded-[13px] px-3 text-[12px] font-bold text-text-muted transition-colors hover:bg-black/[0.035] hover:text-text-primary active:scale-[0.97]"
                >
                  <RotateCcw className="size-4" strokeWidth={2.8} />
                  Réinitialiser
                </button>

                <div className="flex items-center gap-3">
                  {saved && <span className="text-[11px] font-bold text-success">Enregistré</span>}
                  <button
                    type="button"
                    onClick={saveProfile}
                    className="min-h-11 rounded-[14px] border border-white/80 bg-white/72 px-4 text-[12px] font-bold text-text-primary shadow-[inset_0_1px_1px_rgba(255,255,255,1),0_7px_20px_-13px_rgba(0,0,0,0.34)] backdrop-blur-2xl transition-[transform,background-color] hover:bg-white/90 active:scale-[0.96]"
                  >
                    Enregistrer
                  </button>
                </div>
              </div>
            </div>
          </BentoCard>
        </section>

        <section>
          <div className="mb-2.5 flex items-end justify-between gap-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-primary">Environnement</h2>
            <span className="text-[10px] font-semibold text-text-muted">Cortex v0.1</span>
          </div>

          <BentoCard className="overflow-hidden" padding="none">
            <div className="grid grid-cols-1 tablet:grid-cols-3">
              <ProfileFact
                icon={<MonitorCog className="size-[19px]" strokeWidth={2.8} />}
                label="Workspace"
                value="Cortex Lab"
                detail="Cockpit principal"
              />
              <ProfileFact
                icon={<Fingerprint className="size-[19px]" strokeWidth={2.8} />}
                label="Session"
                value="Locale"
                detail="Profil conservé sur cet appareil"
                border
              />
              <ProfileFact
                icon={<ShieldCheck className="size-[19px]" strokeWidth={2.8} />}
                label="Accès"
                value="Single-user"
                detail="Auth multi-utilisateur prévue plus tard"
                border
              />
            </div>
          </BentoCard>
        </section>

        <section>
          <div className="mb-2.5 flex items-end justify-between gap-4">
            <h2 className="text-[11px] font-bold uppercase tracking-[0.13em] text-text-primary">À propos du profil</h2>
          </div>

          <div className="flex items-start gap-3 rounded-[18px] border border-white/60 bg-white/34 px-4 py-3.5 text-text-secondary backdrop-blur-xl">
            <UserRound className="mt-0.5 size-[18px] shrink-0 text-text-primary" strokeWidth={2.8} />
            <p className="text-[12px] font-medium leading-relaxed">
              Cortex fonctionne encore en mode opérateur unique. Cette page gère donc une identité locale utile à l'interface sans simuler de compte distant ni d'authentification inexistante.
            </p>
          </div>
        </section>
      </div>
    </motion.div>
  );
}

function ProfileFact({
  icon,
  label,
  value,
  detail,
  border = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  detail: string;
  border?: boolean;
}) {
  return (
    <div className={`p-4 laptop:p-5 ${border ? "border-t border-black/[0.045] tablet:border-l tablet:border-t-0" : ""}`}>
      <div className="flex items-center gap-2 text-text-muted">
        {icon}
        <span className="text-[9px] font-bold uppercase tracking-[0.12em]">{label}</span>
      </div>
      <p className="mt-3 text-[19px] font-bold tracking-[-0.03em] text-text-primary">{value}</p>
      <p className="mt-1 text-[10px] font-semibold leading-relaxed text-text-muted">{detail}</p>
    </div>
  );
}
