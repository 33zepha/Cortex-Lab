import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
  type RefObject,
} from "react";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { CortexLogo } from "@/components/brand/CortexLogo";
import { Journey } from "@/journey/Journey";
import "./HeroLabScreen.css";

type WaitlistStatus = "idle" | "invalid" | "loading" | "success" | "error";

function clamp(value: number, min = 0, max = 1) {
  return Math.min(min > max ? max : max, Math.max(min, value));
}

export function HeroLabScreen() {
  return (
    <main className="inside" aria-labelledby="inside-title">
      <header className="inside-nav">
        <Link className="inside-nav__brand" to="/" aria-label="Cortex home">
          <CortexLogo aria-hidden="true" />
          <span>CORTEX</span>
        </Link>
        <Link className="inside-nav__signin" to="/login">Sign in</Link>
      </header>
      <section className="inside-entry"><div className="inside-entry__sticky"><div className="inside-entry__content"><div className="inside-entry__mark"><CortexLogo /></div><h1 id="inside-title"><span>One objective.</span><span>Every capability aligned.</span></h1><p>Cortex turns complex work into one directed, inspectable system.</p></div><a className="inside-entry__cue" href="#journey"><span>Enter Cortex</span><i /></a></div></section>
      <Journey />
    </main>
  );
}
