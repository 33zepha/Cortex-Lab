import { FormEvent, useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, Server, Sparkles } from "lucide-react";
import { CortexMark } from "@/components/brand/CortexMark";
import { Button, IconButton, Input } from "@/components/ui";
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
                  <Input className="auth-input" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="boss" required />
                </label>
                <label className="auth-field">
                  <span>Password</span>
                  <div className="auth-password">
                    <Input className="auth-input" type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="••••••••••••" required />
                    <IconButton className="auth-password__toggle" size="sm" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((current) => !current)}>
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </IconButton>
                  </div>
                </label>
                {loginError && <p className="auth-error" role="alert">{loginError}</p>}
                <Button className="auth-primary" variant="primary" type="submit" loading={loginState === "loading"}>
                  <span>{loginState === "loading" ? "Opening workspace…" : "Enter Cortex"}</span>{loginState !== "loading" && <ArrowRight size={15} />}
                </Button>
              </form>

              <div className="auth-account-link">New to Cortex? <button type="button" onClick={() => switchMode("signup")}>Create account</button></div>
            </>
          ) : (
            <>
              <div className="auth-signup-topbar">
                <Button className="auth-back" size="sm" variant="ghost" type="button" onClick={step === "account" ? () => switchMode("login") : goBack}><ArrowLeft size={14} />Back</Button>
                <span>{stepIndex + 1} / {steps.length}</span>
              </div>

              <div className="auth-progress" aria-label="Workspace setup progress">
                {steps.map((item, index) => (
                  <div key={item.id} className={`auth-progress__item ${index <= stepIndex ? "is-active" : ""}`}>
                    <span className="auth-progress__dot">{index < stepIndex ? <Check size={10} /> : index + 1}</span><span>{item.label}</span>
                  </div>
                ))}
              </div>

              {step === "account" && (
                <>
                  <header className="auth-heading auth-heading--signup"><p className="auth-kicker">Identity</p><h1>Create your account.</h1><p>Your identity stays separate from the infrastructure it controls.</p></header>
                  <form className="auth-form" onSubmit={submit}>
                    <label className="auth-field"><span>Email</span><Input className="auth-input" type="email" autoComplete="email" placeholder="you@domain.com" required /></label>
                    <label className="auth-field"><span>Password</span><Input className="auth-input" type="password" autoComplete="new-password" placeholder="12 characters minimum" minLength={12} required /></label>
                    <Button className="auth-primary" variant="primary" type="submit"><span>Continue</span><ArrowRight size={15} /></Button>
                  </form>
                </>
              )}

              {step === "workspace" && (
                <>
                  <header className="auth-heading auth-heading--signup"><p className="auth-kicker">Environment</p><h1>Establish your workspace.</h1><p>This becomes the operational boundary for missions, agents and evidence.</p></header>
                  <form className="auth-form" onSubmit={submit}>
                    <label className="auth-field"><span>Workspace name</span><Input className="auth-input" value={workspaceName} onChange={(event) => setWorkspaceName(event.target.value)} required /></label>
                    <div className="auth-context-line"><Sparkles size={14} /><span>You can rename it later without affecting runtime connections.</span></div>
                    <Button className="auth-primary" variant="primary" type="submit"><span>Configure runtime</span><ArrowRight size={15} /></Button>
                  </form>
                </>
              )}

              {step === "runtime" && (
                <>
                  <header className="auth-heading auth-heading--signup"><p className="auth-kicker">Runtime connection</p><h1>Connect Cortex.</h1><p>Point this workspace to the infrastructure that will execute its missions.</p></header>
                  <form className="auth-form" onSubmit={(event) => event.preventDefault()}>
                    <div className="auth-runtime-card">
                      <div className="auth-runtime-card__title"><Server size={16} /><span>VPS</span></div>
                      <label className="auth-field"><span>Host / Tailscale IP</span><Input className="auth-input" value={vpsHost} onChange={(event) => setVpsHost(event.target.value)} placeholder="100.x.x.x" /></label>
                      <label className="auth-field"><span>SSH user</span><Input className="auth-input" value={vpsUser} onChange={(event) => setVpsUser(event.target.value)} placeholder="root" /></label>
                    </div>
                    <div className="auth-runtime-card">
                      <div className="auth-runtime-card__title"><LockKeyhole size={16} /><span>Cortex API</span></div>
                      <label className="auth-field"><span>API origin</span><Input className="auth-input" value={apiOrigin} onChange={(event) => setApiOrigin(event.target.value)} placeholder="https://api.example.com" /></label>
                      <div className="auth-context-line"><LockKeyhole size={13} /><span>API tokens and SSH secrets are never stored in the browser.</span></div>
                    </div>
                    <Button className="auth-primary" variant="primary" type="submit"><span>Verify connections</span><ArrowRight size={15} /></Button>
                    <Button className="auth-tertiary" variant="ghost" type="button">Skip for now</Button>
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
