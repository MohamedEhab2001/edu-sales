"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { clientApi } from "@/lib/client-api";

export default function LoginPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      await clientApi("/api/auth/login", {
        method: "POST",
        body: JSON.stringify({ email: form.get("email"), password: form.get("password") }),
      });
      router.replace("/");
      router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not sign in.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-showcase">
        <div className="login-brand">
          <span className="brand-mark brand-mark--light" aria-hidden="true"><i /><i /><i /></span>
          <strong>Edulato</strong>
        </div>
        <div className="login-copy">
          <span className="eyebrow eyebrow--dark">Sales workspace</span>
          <h1>Every lead, call and follow-up in one clear place.</h1>
          <p>Keep the team focused on the next conversation while the system keeps the history organized.</p>
          <div className="login-proof">
            <span><b>01</b> Capture leads</span>
            <span><b>02</b> Schedule calls</span>
            <span><b>03</b> Follow through</span>
          </div>
        </div>
      </section>

      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <div className="login-form-heading">
            <span className="eyebrow">Welcome back</span>
            <h2>Sign in to Edulato Sales</h2>
            <p>Use the account configured during the initial database seed.</p>
          </div>
          {error ? <div className="alert alert--error">{error}</div> : null}
          <label className="field">
            <span>Email address</span>
            <input name="email" type="email" autoComplete="email" required placeholder="admin@edulato.com" />
          </label>
          <label className="field">
            <span>Password</span>
            <input name="password" type="password" autoComplete="current-password" required placeholder="Your password" />
          </label>
          <button className="button button--primary button--large" type="submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </button>
          <p className="form-note">The account is created with <code>npm run seed</code>.</p>
        </form>
      </section>
    </main>
  );
}
