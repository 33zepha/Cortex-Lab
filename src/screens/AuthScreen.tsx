import { FormEvent, PointerEvent as ReactPointerEvent, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { CheckIcon, GlobeAltIcon, ServerStackIcon } from "@heroicons/react/24/solid";
import { ArrowLeft, ArrowRight, Eye, EyeOff, LockKeyhole, Plus, X } from "lucide-react";
import { AuthStepNav } from "@/components/auth/AuthStepNav";
import { CortexMark } from "@/components/brand/CortexMark";
import { DitherAtmosphere } from "@/components/effects/DitherAtmosphere";
import { IconButton, Input, LiquidButton, LiquidSurface } from "@/components/ui";
import { login as authenticate, signup as createAccount, type AuthConnection } from "@/lib/auth";
import "@/styles/auth.css";
import "@/styles/auth-actions.css";
import "@/styles/auth-effects.css";
import "@/styles/auth-hero.css";

type AuthMode = "login" | "signup";
type SignupStep = "account" | "workspace" | "runtime";
type ConnectionLayer = "closed" | "root" | "vps" | "api";
interface AuthScreenProps { initialMode?: AuthMode; }
const STEPS: SignupStep[] = ["account", "workspace", "runtime"];
const AUTH_SPRING = { type: "spring" as const, stiffness: 430, damping: 32, mass: .72 };
const MOBILE_TRANSITION = { duration: .19, ease: [0.22, 1, 0.36, 1] as const };

function ActionContent({ label }: { label: string }) {
  return <><span className="auth-action__label">{label}</span><span className="auth-action__terminal" aria-hidden><ArrowRight size={14} strokeWidth={2.35} /></span></>;
}

export function AuthScreen({ initialMode = "login" }: AuthScreenProps) {
  const reduceMotion = useReducedMotion();
  const entryRef = useRef<HTMLElement>(null);
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<SignupStep>("account");
  const [furthestStep, setFurthestStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginState, setLoginState] = useState<"idle" | "loading">("idle");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [accountEmail, setAccountEmail] = useState("");
  const [accountPassword, setAccountPassword] = useState("");
  const [accountPasswordConfirm, setAccountPasswordConfirm] = useState("");
  const [signupState, setSignupState] = useState<"idle" | "loading">("idle");
  const [signupError, setSignupError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Cortex Lab");
  const [connectionLayer, setConnectionLayer] = useState<ConnectionLayer>("closed");
  const [vpsHost, setVpsHost] = useState("");
  const [vpsUser, setVpsUser] = useState("root");
  const [apiOrigin, setApiOrigin] = useState("");
  const [savedConnection, setSavedConnection] = useState<AuthConnection | null>(null);
  const mobileRenderingTarget = typeof window !== "undefined" && window.matchMedia("(max-width: 900px), (pointer: coarse)").matches;
  const transition = reduceMotion ? { duration: 0 } : mobileRenderingTarget ? MOBILE_TRANSITION : AUTH_SPRING;
  const stepIndex = STEPS.indexOf(step);

  function switchMode(next: AuthMode) {
    setMode(next); setStep("account"); setFurthestStep(0); setDirection(1); setConnectionLayer("closed"); setLoginError(null); setSignupError(null);
  }
  function navigateStep(next: SignupStep) {
    const nextIndex = STEPS.indexOf(next);
    setDirection(nextIndex >= stepIndex ? 1 : -1); setStep(next); setFurthestStep((current) => Math.max(current, nextIndex)); setConnectionLayer("closed");
  }
  function validateAccount(): string | null {
    if (!/^\S+@\S+\.\S+$/.test(accountEmail.trim())) return "Renseigne une adresse email valide.";
    if (accountPassword.length < 12) return "Le mot de passe doit contenir au moins 12 caractères.";
    if (accountPassword !== accountPasswordConfirm) return "Les deux mots de passe ne correspondent pas.";
    return null;
  }

  function validateWorkspace(): string | null {
    const name = workspaceName.trim();
    return name.length < 2 ? "Donne un nom à ton workspace." : name.length > 80 ? "Le nom du workspace est trop long." : null;
  }

  async function finishSignup() {
    const accountError = validateAccount();
    const workspaceError = validateWorkspace();
    if (accountError || workspaceError) {
      setSignupError(accountError ?? workspaceError);
      return;
    }
    setSignupError(null);
    setSignupState("loading");
    try {
      await createAccount({
        email: accountEmail.trim(),
        password: accountPassword,
        workspaceName: workspaceName.trim(),
        connections: savedConnection ? [savedConnection] : [],
      });
      window.location.assign("/");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Création du compte impossible.";
      setSignupError(message === "Un compte existe déjà avec cet email" ? "Un compte existe déjà avec cet email." : message);
      setSignupState("idle");
    }
  }

  function saveVpsConnection() {
    const host = vpsHost.trim();
    const user = vpsUser.trim() || "root";
    if (!host) {
      setSignupError("Renseigne l’hôte ou l’IP Tailscale du VPS.");
      return;
    }
    setSavedConnection({ type: "vps", host, user });
    setSignupError(null);
    setConnectionLayer("closed");
  }

  function saveApiConnection() {
    const origin = apiOrigin.trim();
    if (!origin) {
      setSignupError("Renseigne l’origine de l’API.");
      return;
    }
    try {
      new URL(origin);
    } catch {
      setSignupError("L’origine de l’API doit être une URL valide.");
      return;
    }
    setSavedConnection({ type: "api", origin });
    setSignupError(null);
    setConnectionLayer("closed");
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "login") {
      if (!email.trim() || !password) return;
      setLoginError(null); setLoginState("loading");
      try { await authenticate(email.trim(), password); window.location.assign("/"); }
      catch (error) {
        setLoginError(error instanceof Error && error.message === "Invalid credentials" ? "Identifiant ou mot de passe incorrect." : "Connexion impossible. Réessaie dans un instant.");
        setLoginState("idle");
      }
      return;
    }
    if (step === "account") {
      const error = validateAccount();
      if (error) { setSignupError(error); return; }
      setSignupError(null);
      navigateStep("workspace");
    } else if (step === "workspace") {
      const error = validateWorkspace();
      if (error) { setSignupError(error); return; }
      setSignupError(null);
      navigateStep("runtime");
    }
  }
  function goBack() {
    if (connectionLayer === "vps" || connectionLayer === "api") { setConnectionLayer("root"); return; }
    if (step === "runtime") navigateStep("workspace"); else if (step === "workspace") navigateStep("account"); else switchMode("login");
  }
  function updateSceneLight(event: ReactPointerEvent<HTMLElement>) {
    if (mobileRenderingTarget || event.pointerType === "touch") return;
    const node = entryRef.current;
    if (!node) return;
    const rect = node.getBoundingClientRect();
    node.style.setProperty("--auth-pointer-x", `${event.clientX - rect.left}px`);
    node.style.setProperty("--auth-pointer-y", `${event.clientY - rect.top}px`);
  }
  const screenMotion = reduceMotion ? { initial: { opacity: 1 }, animate: { opacity: 1 }, exit: { opacity: 1 } } : mobileRenderingTarget ? {
    initial: { opacity: 0, y: 5 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -3 },
  } : {
    initial: { opacity: 0, x: direction * 11, y: 2, scale: .996 },
    animate: { opacity: 1, x: 0, y: 0, scale: 1 },
    exit: { opacity: 0, x: direction * -8, y: -1, scale: .997 },
  };

  return (
    <main ref={entryRef} className="auth-entry" data-auth-revision="hero-hq-v10" onPointerMove={updateSceneLight}>
      <img
        className="auth-art__image auth-scene__image"
        src="/cortex-auth-hero-2560.webp"
        srcSet="/cortex-auth-hero-1920.webp 1920w, /cortex-auth-hero-2560.webp 2560w, /cortex-auth-hero-3840.webp 3840w"
        sizes="100vw"
        fetchPriority="high"
        loading="eager"
        decoding="async"
        draggable={false}
        alt="Monument sculptural représentant plusieurs intelligences coordonnées dans un même environnement."
      />
      <div className="auth-scene__veil" aria-hidden />
      <DitherAtmosphere />
      <div className="auth-scene__grain" aria-hidden />
      <div className="auth-art__brand"><CortexMark className="auth-art__mark" /><span>CORTEX</span></div>
      <section className="auth-stage" aria-label={mode === "login" ? "Sign in to Cortex" : "Create a Cortex workspace"}>
        <div className="auth-panel__inner">
          <AnimatePresence mode={mobileRenderingTarget ? "sync" : "wait"} initial={false} custom={direction}>
            {mode === "login" ? (
              <motion.div key="login" className="auth-composition" {...screenMotion} transition={transition}>
                <header className="auth-heading auth-heading--login"><h1>Welcome back.</h1></header>
                <form className="auth-form" onSubmit={submit}>
                  <LiquidSurface variant="core" className="auth-credential-rail">
                    <label className="auth-credential-row"><span>Email / user</span><Input className="auth-rail-input" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="boss" required /></label>
                    <div className="auth-rail-divider" />
                    <label className="auth-credential-row"><span>Password</span><div className="auth-password"><Input className="auth-rail-input" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" required /><IconButton className="auth-password__toggle" size="sm" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((value) => !value)}>{showPassword ? <EyeOff size={15} strokeWidth={2.7} /> : <Eye size={15} strokeWidth={2.7} />}</IconButton></div></label>
                  </LiquidSurface>
                  {loginError && <p className="auth-error" role="alert">{loginError}</p>}
                  <LiquidButton sheen={false} className="auth-action" variant="core" type="submit" disabled={loginState === "loading"}><ActionContent label={loginState === "loading" ? "Opening…" : "Enter Cortex"} /></LiquidButton>
                </form>
                <button className="auth-account-link" type="button" onClick={() => switchMode("signup")}>Create account</button>
              </motion.div>
            ) : (
              <motion.div key={`signup-${step}`} className="auth-composition" {...screenMotion} transition={transition}>
                <div className="auth-signup-topbar"><button className="auth-back auth-nav-link" type="button" onClick={goBack}><ArrowLeft size={14} strokeWidth={2.35} /><span>Back</span></button><AuthStepNav step={step} furthestStep={furthestStep} onSelect={navigateStep} /></div>
                {step === "account" && <>
                  <header className="auth-heading auth-heading--signup"><h1>Create account.</h1></header>
                  <form className="auth-form" onSubmit={submit}>
                    <LiquidSurface variant="core" className="auth-credential-rail">
                      <label className="auth-credential-row"><span>Email</span><Input className="auth-rail-input" type="email" autoComplete="email" value={accountEmail} onChange={(event) => setAccountEmail(event.target.value)} placeholder="you@domain.com" required /></label>
                      <div className="auth-rail-divider" />
                      <label className="auth-credential-row"><span>Password</span><Input className="auth-rail-input" type="password" autoComplete="new-password" value={accountPassword} onChange={(event) => setAccountPassword(event.target.value)} placeholder="12 characters minimum" minLength={12} required /></label>
                      <div className="auth-rail-divider" />
                      <label className="auth-credential-row"><span>Confirm</span><Input className="auth-rail-input" type="password" autoComplete="new-password" value={accountPasswordConfirm} onChange={(event) => setAccountPasswordConfirm(event.target.value)} placeholder="Repeat password" minLength={12} required /></label>
                    </LiquidSurface>
                    {signupError && <p className="auth-error" role="alert">{signupError}</p>}
                    <LiquidButton sheen={false} className="auth-action" variant="core" type="submit"><ActionContent label="Continue" /></LiquidButton>
                  </form>
                </>}
                {step === "workspace" && <>
                  <header className="auth-heading auth-heading--signup"><h1>Name your space.</h1></header>
                  <form className="auth-form" onSubmit={submit}>
                    <LiquidSurface variant="core" className="auth-workspace-editor"><span className="auth-workspace-editor__mark"><CortexMark /></span><div><span className="auth-workspace-editor__label">Workspace</span><Input aria-label="Workspace" className="auth-workspace-input" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} required /></div></LiquidSurface>
                    {signupError && <p className="auth-error" role="alert">{signupError}</p>}
                    <LiquidButton sheen={false} className="auth-action auth-action--wide" variant="core" type="submit"><ActionContent label="Continue" /></LiquidButton>
                  </form>
                </>}
                {step === "runtime" && <>
                  <header className="auth-heading auth-heading--signup auth-heading--runtime"><h1>Connect Cortex.</h1><p>Attach only the infrastructure this workspace needs. You can also continue without it.</p></header>
                  <div className="auth-runtime-stage">
                    <div className="auth-workspace-line"><CortexMark /><div><strong>{workspaceName || "Cortex Lab"}</strong><span>Workspace ready to create</span></div><CheckIcon aria-hidden /></div>
                    <motion.div className="auth-connection-morph" layout transition={transition} data-layer={connectionLayer}>
                      <AnimatePresence mode="popLayout" initial={false}>
                        {connectionLayer === "closed" ? <LiquidButton sheen={false} layoutId="connection-surface" key="closed" variant="wing" className="auth-add-connection" type="button" onClick={() => setConnectionLayer("root")} transition={transition}><span className="auth-command__icon" aria-hidden><Plus size={15} strokeWidth={2.4} /></span><span>{savedConnection ? "Replace connection" : "Add connection"}</span></LiquidButton> : <LiquidSurface layoutId="connection-surface" key="surface" variant="popover" className="auth-child-menu" transition={transition}>
                          {connectionLayer === "root" && <div className="auth-child-menu__root"><div className="auth-child-menu__head"><strong>Connection</strong><button className="auth-icon-action" type="button" onClick={() => setConnectionLayer("closed")} aria-label="Close connection menu"><X size={14} strokeWidth={2.3} /></button></div><div className="auth-child-menu__list"><button type="button" className="auth-child-row" onClick={() => setConnectionLayer("vps")}><ServerStackIcon className="auth-child-row__icon" aria-hidden /><span><strong>VPS / SSH</strong><small>Remote execution environment</small></span></button><div className="auth-child-divider" /><button type="button" className="auth-child-row" onClick={() => setConnectionLayer("api")}><GlobeAltIcon className="auth-child-row__icon" aria-hidden /><span><strong>API origin</strong><small>Cortex or provider endpoint</small></span></button></div></div>}
                          {connectionLayer === "vps" && <div className="auth-child-form"><button className="auth-child-back auth-nav-link" type="button" onClick={() => setConnectionLayer("root")}><ArrowLeft size={13} strokeWidth={2.3} /><span>VPS / SSH</span></button><div className="auth-child-field-stack"><label className="auth-child-field"><span>Host / Tailscale IP</span><Input className="auth-child-input" value={vpsHost} onChange={(event) => setVpsHost(event.target.value)} placeholder="100.x.x.x" /></label><label className="auth-child-field"><span>SSH user</span><Input className="auth-child-input" value={vpsUser} onChange={(event) => setVpsUser(event.target.value)} placeholder="root" /></label></div><LiquidButton sheen={false} className="auth-action auth-action--compact auth-child-save" variant="core" type="button" onClick={saveVpsConnection}><ActionContent label="Save connection" /></LiquidButton></div>}
                          {connectionLayer === "api" && <div className="auth-child-form"><button className="auth-child-back auth-nav-link" type="button" onClick={() => setConnectionLayer("root")}><ArrowLeft size={13} strokeWidth={2.3} /><span>API origin</span></button><label className="auth-child-field"><span>Origin</span><Input className="auth-child-input" value={apiOrigin} onChange={(event) => setApiOrigin(event.target.value)} placeholder="https://api.example.com" /></label><div className="auth-secret-note"><LockKeyhole size={13} strokeWidth={2.4} /> Secrets stay server-side.</div><LiquidButton sheen={false} className="auth-action auth-action--compact auth-child-save" variant="core" type="button" onClick={saveApiConnection}><ActionContent label="Save connection" /></LiquidButton></div>}
                        </LiquidSurface>}
                      </AnimatePresence>
                    </motion.div>
                    {savedConnection && <div className="auth-connection-status"><CheckIcon aria-hidden /><span><strong>{savedConnection.type === "vps" ? "VPS / SSH" : "API origin"}</strong><small>{savedConnection.type === "vps" ? savedConnection.host : savedConnection.origin}</small></span><button type="button" onClick={() => setSavedConnection(null)}>Remove</button></div>}
                    {signupError && <p className="auth-error" role="alert">{signupError}</p>}
                    <div className="auth-runtime-actions">
                      <LiquidButton sheen={false} className="auth-action auth-action--wide" variant="core" type="button" onClick={() => void finishSignup()} disabled={signupState === "loading"}><ActionContent label={signupState === "loading" ? "Creating…" : "Create workspace"} /></LiquidButton>
                      {savedConnection && <button className="auth-skip" type="button" onClick={() => void finishSignup()} disabled={signupState === "loading"}>Continue without connection</button>}
                    </div>
                  </div>
                </>}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>
    </main>
  );
}
