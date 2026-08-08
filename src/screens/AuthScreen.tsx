import { FormEvent, useMemo, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, ChevronRight, Eye, EyeOff, Globe2, LockKeyhole, Plus, Server } from "lucide-react";
import { CortexMark } from "@/components/brand/CortexMark";
import { Button, IconButton, Input } from "@/components/ui";
import { login as authenticate } from "@/lib/auth";
import "@/styles/auth.css";

type AuthMode = "login" | "signup";
type SignupStep = "account" | "workspace" | "runtime";
type ConnectionLayer = "closed" | "root" | "vps" | "api";
interface AuthScreenProps { initialMode?: AuthMode; }
const steps: SignupStep[] = ["account", "workspace", "runtime"];
const spring = { type: "spring" as const, stiffness: 460, damping: 35, mass: .68 };

export function AuthScreen({ initialMode = "login" }: AuthScreenProps) {
  const reduceMotion = useReducedMotion();
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<SignupStep>("account");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginState, setLoginState] = useState<"idle" | "loading">("idle");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Cortex Lab");
  const [connectionLayer, setConnectionLayer] = useState<ConnectionLayer>("closed");
  const [vpsHost, setVpsHost] = useState("");
  const [vpsUser, setVpsUser] = useState("root");
  const [apiOrigin, setApiOrigin] = useState("");
  const stepIndex = useMemo(() => steps.indexOf(step), [step]);
  const transition = reduceMotion ? { duration: 0 } : spring;

  function switchMode(next: AuthMode) { setMode(next); setStep("account"); setConnectionLayer("closed"); setLoginError(null); }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "login") {
      if (!email.trim() || !password) return;
      setLoginError(null); setLoginState("loading");
      try { await authenticate(email.trim(), password); window.location.assign("/"); }
      catch (error) { setLoginError(error instanceof Error && error.message === "Invalid credentials" ? "Identifiant ou mot de passe incorrect." : "Connexion impossible. Réessaie dans un instant."); setLoginState("idle"); }
      return;
    }
    if (step === "account") setStep("workspace"); else if (step === "workspace") setStep("runtime");
  }
  function goBack() {
    if (connectionLayer === "vps" || connectionLayer === "api") return setConnectionLayer("root");
    if (step === "runtime") setStep("workspace"); else if (step === "workspace") setStep("account");
  }
  const screenMotion = { initial: reduceMotion ? { opacity: 1 } : { opacity: 0, y: 10, filter: "blur(6px)" }, animate: { opacity: 1, y: 0, filter: "blur(0px)" }, exit: reduceMotion ? { opacity: 1 } : { opacity: 0, y: -7, filter: "blur(4px)" } };

  return <main className="auth-entry">
    <section className="auth-art" aria-label="Cortex — distributed intelligence">
      <img className="auth-art__image" src="/cortex-auth-hero.jpg" alt="Monument sculptural représentant plusieurs intelligences coordonnées dans un même environnement." />
      <div className="auth-art__veil" />
      <div className="auth-art__brand"><CortexMark className="auth-art__mark" /><span>CORTEX</span></div>
    </section>

    <section className="auth-panel">
      <div className="auth-panel__inner">
        <div className="auth-mobile-brand"><CortexMark className="auth-mobile-brand__mark" /><span>CORTEX</span></div>
        <AnimatePresence mode="wait" initial={false}>
          {mode === "login" ? <motion.div key="login" className="auth-composition" {...screenMotion} transition={transition}>
            <header className="auth-heading"><h1>Welcome back.</h1><p>Your workspace is exactly where you left it.</p></header>
            <form className="auth-form" onSubmit={submit}>
              <label className="auth-field"><span>Username</span><Input className="auth-input" autoComplete="username" value={email} onChange={e => setEmail(e.target.value)} placeholder="boss" required /></label>
              <label className="auth-field"><span>Password</span><div className="auth-password"><Input className="auth-input" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••••••" required /><IconButton className="auth-password__toggle" size="sm" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(v => !v)}>{showPassword ? <EyeOff size={15}/> : <Eye size={15}/>}</IconButton></div></label>
              {loginError && <p className="auth-error" role="alert">{loginError}</p>}
              <Button className="auth-primary" variant="primary" type="submit" loading={loginState === "loading"}><span>{loginState === "loading" ? "Opening workspace…" : "Enter Cortex"}</span>{loginState !== "loading" && <ArrowRight size={15}/>}</Button>
            </form>
            <div className="auth-account-link">New here? <button type="button" onClick={() => switchMode("signup")}>Create account</button></div>
          </motion.div> :
          <motion.div key={`signup-${step}`} className="auth-composition" {...screenMotion} transition={transition}>
            <div className="auth-signup-topbar"><Button className="auth-back" size="sm" variant="ghost" type="button" onClick={goBack}><ArrowLeft size={14}/> Back</Button><button className="auth-step-label" type="button" aria-label={`Step ${stepIndex + 1} of 3`}>{steps[stepIndex]}</button></div>
            {step === "account" && <><header className="auth-heading auth-heading--signup"><h1>Create your account.</h1><p>One identity. One private Cortex environment.</p></header><form className="auth-form" onSubmit={submit}><label className="auth-field"><span>Email</span><Input className="auth-input" type="email" autoComplete="email" placeholder="you@domain.com" required /></label><label className="auth-field"><span>Password</span><Input className="auth-input" type="password" autoComplete="new-password" placeholder="12 characters minimum" minLength={12} required /></label><Button className="auth-primary" variant="primary" type="submit"><span>Continue</span><ArrowRight size={15}/></Button></form></>}
            {step === "workspace" && <><header className="auth-heading auth-heading--signup"><h1>Name your space.</h1><p>The home for your agents, missions and connected runtimes.</p></header><form className="auth-form" onSubmit={submit}><label className="auth-field"><span>Workspace</span><Input className="auth-input auth-input--hero" value={workspaceName} onChange={e => setWorkspaceName(e.target.value)} required /></label><Button className="auth-primary" variant="primary" type="submit"><span>Continue</span><ArrowRight size={15}/></Button></form></>}
            {step === "runtime" && <><header className="auth-heading auth-heading--signup auth-heading--runtime"><h1>Connect Cortex.</h1><p>Add only what this workspace needs.</p></header>
              <div className="auth-runtime-stage">
                <div className="auth-workspace-chip"><span className="auth-workspace-chip__mark"><CortexMark/></span><span><strong>{workspaceName || "Cortex Lab"}</strong><small>Workspace ready</small></span><Check size={15}/></div>
                <motion.div className="auth-connection-morph" layout transition={transition} data-layer={connectionLayer}>
                  <AnimatePresence mode="popLayout" initial={false}>
                    {connectionLayer === "closed" ? <motion.button layoutId="connection-surface" key="closed" className="auth-add-connection" type="button" onClick={() => setConnectionLayer("root")} transition={transition}><Plus size={16}/><span>Add connection</span></motion.button> :
                    <motion.div layoutId="connection-surface" key="surface" className="auth-child-menu" transition={transition} initial={reduceMotion ? false : { opacity:.65, scale:.96 }} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.96}}>
                      <div className="auth-child-menu__shine" />
                      {connectionLayer === "root" && <div className="auth-child-menu__list"><button type="button" className="auth-child-row" onClick={() => setConnectionLayer("vps")}><span className="auth-child-row__icon"><Server size={17}/></span><span><strong>VPS / SSH</strong><small>Remote runtime</small></span><ChevronRight size={15}/></button><button type="button" className="auth-child-row" onClick={() => setConnectionLayer("api")}><span className="auth-child-row__icon"><Globe2 size={17}/></span><span><strong>API origin</strong><small>Cortex or provider</small></span><ChevronRight size={15}/></button></div>}
                      {connectionLayer === "vps" && <div className="auth-child-form"><button className="auth-child-back" type="button" onClick={() => setConnectionLayer("root")}><ArrowLeft size={14}/> VPS / SSH</button><label className="auth-field"><span>Host / Tailscale IP</span><Input className="auth-input" value={vpsHost} onChange={e => setVpsHost(e.target.value)} placeholder="100.x.x.x"/></label><label className="auth-field"><span>SSH user</span><Input className="auth-input" value={vpsUser} onChange={e => setVpsUser(e.target.value)} placeholder="root"/></label><Button className="auth-child-save" variant="primary" type="button" onClick={() => setConnectionLayer("closed")}>Save connection</Button></div>}
                      {connectionLayer === "api" && <div className="auth-child-form"><button className="auth-child-back" type="button" onClick={() => setConnectionLayer("root")}><ArrowLeft size={14}/> API origin</button><label className="auth-field"><span>Origin</span><Input className="auth-input" value={apiOrigin} onChange={e => setApiOrigin(e.target.value)} placeholder="https://api.example.com"/></label><div className="auth-secret-note"><LockKeyhole size={13}/>Secrets stay server-side.</div><Button className="auth-child-save" variant="primary" type="button" onClick={() => setConnectionLayer("closed")}>Save connection</Button></div>}
                    </motion.div>}
                  </AnimatePresence>
                </motion.div>
                <button className="auth-skip" type="button">Continue without connection</button>
              </div></>}
          </motion.div>}
        </AnimatePresence>
      </div>
    </section>
  </main>;
}
