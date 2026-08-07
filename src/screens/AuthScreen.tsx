import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Server, Sparkles } from "lucide-react";
import { CortexMark } from "@/components/brand/CortexMark";
import { login as authenticate } from "@/lib/auth";
import "@/styles/auth.css";

type AuthMode = "login" | "signup";
type SignupStep = "account" | "workspace" | "runtime";

interface AuthScreenProps {
  initialMode?: AuthMode;
}

const steps: { id: SignupStep; label: string }[] = [
  { id: "account", label: "Compte" },
  { id: "workspace", label: "Workspace" },
  { id: "runtime", label: "Connexion" },
];

export function AuthScreen({ initialMode = "login" }: AuthScreenProps) {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [step, setStep] = useState<SignupStep>("account");
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginState, setLoginState] = useState<"idle" | "loading">("idle");
  const [loginError, setLoginError] = useState<string | null>(null);
  const [workspaceName, setWorkspaceName] = useState("Cortex Lab");
  const [vpsHost, setVpsHost] = useState("");
  const [vpsUser, setVpsUser] = useState("root");
  const [apiOrigin, setApiOrigin] = useState("");

  const stepIndex = useMemo(() => steps.findIndex((item) => item.id === step), [step]);

  function switchMode(next: AuthMode) {
    setMode(next);
    setStep("account");
    setLoginError(null);
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (mode === "login") {
      if (!email.trim() || !password) return;
      setLoginError(null);
      setLoginState("loading");
      try {
        await authenticate(email.trim(), password);
        window.location.assign("/");
      } catch (error) {
        setLoginError(error instanceof Error && error.message === "Invalid credentials" ? "Identifiant ou mot de passe incorrect." : "Connexion impossible. Réessaie dans un instant.");
        setLoginState("idle");
      }
      return;
    }
    if (step === "account") setStep("workspace");
    else if (step === "workspace") setStep("runtime");
  }

  function goBack() {
    if (step === "runtime") setStep("workspace");
    else if (step === "workspace") setStep("account");
  }

  return (
    <main className="auth-entry">
      <section className="auth-art" aria-label="Cortex — distributed intelligence">
        <img className="auth-art__image" src="/cortex-auth-hero.jpg" alt="Monument sculptural représentant plusieurs intelligences coordonnées dans un même environnement." />
        <div className="auth-art__veil" />
        <div className="auth-art__brand"><CortexMark className="auth-art__mark" /><span>CORTEX</span></div>
        <div className="auth-art__caption"><span className="auth-art__eyebrow">Operational intelligence</span><p>One environment. Multiple intelligences. Precisely coordinated.</p></div>
      </section>

      <section className="auth-panel">
        <div className="auth-panel__inner">
          <div className="auth-mobile-brand" aria-hidden="true"><CortexMark className="auth-mobile-brand__mark" /><span>CORTEX</span></div>

          {mode === "login" ? (
            <>
              <header className="auth-heading">
                <p className="auth-kicker">Private workspace</p>
                <h1>Welcome back.</h1>
                <p>Access your Cortex environment.</p>
              </header>

              <form className="auth-form" onSubmit={submit}>
                <label className="auth-field">
                  <span>Username</span>
                  <input autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="boss" required />
                </label>
                <label className="auth-field">
                  <span>Password</span>
                  <div className="auth-password">
                    <input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" required />
                    <button className="auth-password__toggle" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </label>
                {loginError && <p className="auth-error" role="alert">{loginError}</p>}
                <button className="auth-primary" type="submit" disabled={loginState === "loading"}>
                  <span>{loginState === "loading" ? "Opening workspace…" : "Enter Cortex"}</span><ArrowRight size={16} />
                </button>
              </form>

              <div className="auth-divider"><span>or</span></div>
              <button className="auth-secondary" type="button" onClick={() => switchMode("signup")}>Create a new account</button>
              <p className="auth-footnote">New account means a new isolated workspace and its own runtime connections.</p>
            </>
          ) : (
            <>
              <div className="auth-signup-topbar">
                <button className="auth-back" type="button" onClick={step === "account" ? () => switchMode("login") : goBack}><ArrowLeft size={15} />Back</button>
                <span>{stepIndex + 1} / {steps.length}</span>
              </div>

              <div className="auth-progress" aria-label="Workspace setup progress">
                {steps.map((item, index) => (
                  <div key={item.id} className={`auth-progress__item ${index <= stepIndex ? "is-active" : ""}`}>
                    <span className="auth-progress__dot">{index < stepIndex ? <Check size={11} /> : index + 1}</span><span>{item.label}</span>
                  </div>
                ))}
              </div>

              {step === "account" && (
                <>
                  <header className="auth-heading auth-heading--signup"><p className="auth-kicker">Identity</p><h1>Create your account.</h1><p>Your identity stays separate from the infrastructure it controls.</p></header>
                  <form className="auth-form" onSubmit={submit}>
                    <label className="auth-field"><span>Email</span><input type="email" autoComplete="email" placeholder="you@domain.com" required /></label>
                    <label className="auth-field"><span>Password</span><input type="password" autoComplete="new-password" placeholder="12 characters minimum" minLength={12} required /></label>
                    <button className="auth-primary" type="submit"><span>Continue</span><ArrowRight size={16} /></button>
                  </form>
                </>
              )}

              {step === "workspace" && (
                <>
                  <header className="auth-heading auth-heading--signup"><p className="auth-kicker">Environment</p><h1>Establish your workspace.</h1><p>This becomes the operational boundary for missions, agents and evidence.</p></header>
                  <form className="auth-form" onSubmit={submit}>
                    <label className="auth-field"><span>Workspace name</span><input value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} required /></label>
                    <div className="auth-context-line"><Sparkles size={15} /><span>You can rename it later without affecting runtime connections.</span></div>
                    <button className="auth-primary" type="submit"><span>Configure runtime</span><ArrowRight size={16} /></button>
                  </form>
                </>
              )}

              {step === "runtime" && (
                <>
                  <header className="auth-heading auth-heading--signup"><p className="auth-kicker">Runtime connection</p><h1>Connect Cortex.</h1><p>Point this workspace to the infrastructure that will execute its missions.</p></header>
                  <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                    <div className="auth-runtime-card">
                      <div className="auth-runtime-card__title"><Server size={17} /><span>VPS</span></div>
                      <label className="auth-field"><span>Host / Tailscale IP</span><input value={vpsHost} onChange={(event) => setVpsHost(event.target.value)} placeholder="100.x.x.x" /></label>
                      <label className="auth-field"><span>SSH user</span><input value={vpsUser} onChange={(event) => setVpsUser(event.target.value)} placeholder="root" /></label>
                    </div>
                    <div className="auth-runtime-card">
                      <div className="auth-runtime-card__title"><LockKeyhole size={17} /><span>Cortex API</span></div>
                      <label className="auth-field"><span>API origin</span><input value={apiOrigin} onChange={(event) => setApiOrigin(event.target.value)} placeholder="https://api.example.com" /></label>
                      <div className="auth-context-line"><LockKeyhole size={14} /><span>API tokens and SSH secrets are never stored in the browser.</span></div>
                    </div>
                    <button className="auth-primary" type="submit"><span>Verify connections</span><ArrowRight size={16} /></button>
                    <button className="auth-tertiary" type="button">Skip for now</button>
                  </form>
                </>
              )}
            </>
          )}
        </div>
      </section>
    </main>
  );
}
