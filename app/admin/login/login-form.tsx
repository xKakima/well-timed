"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setSubmitting(true);

    try {
      const supabase = getSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (signInError) {
        setMessage("Sign-in failed. Check your credentials and try again.");
        return;
      }

      const { data, error: authorizationError } = await supabase.rpc("is_admin");
      if (authorizationError) {
        console.error("Could not verify administrator access.", authorizationError);
        await supabase.auth.signOut();
        setMessage("Administrator access could not be verified. Please try again.");
        return;
      }

      if (!data) {
        await supabase.auth.signOut();
        setMessage("This account is not authorized to access the administrator area.");
        return;
      }

      router.replace("/admin/listings");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The sign-in service is unavailable. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <label htmlFor="admin-email">Email</label>
      <input
        autoComplete="username"
        id="admin-email"
        onChange={(event) => setEmail(event.target.value)}
        required
        type="email"
        value={email}
      />
      <label htmlFor="admin-password">Password</label>
      <input
        autoComplete="current-password"
        id="admin-password"
        onChange={(event) => setPassword(event.target.value)}
        required
        type="password"
        value={password}
      />
      {message && <p className="form-message" role="alert">{message}</p>}
      <button className="button-primary" disabled={submitting} type="submit">
        {submitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
