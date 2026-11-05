import type { Metadata } from "next";
import Link from "next/link";
import AdminLoginForm from "./login-form";

export const metadata: Metadata = {
  title: "Administrator sign in",
  robots: { index: false, follow: false },
};

export default function AdminLoginPage() {
  return (
    <main className="admin-page">
      <Link className="back-link" href="/">Well Timed Collective</Link>
      <section className="admin-panel">
        <p className="eyebrow">Staff access</p>
        <h1>Administrator sign in</h1>
        <p className="admin-intro">
          This area is for invited administrators only. There is no public sign-up.
        </p>
        <AdminLoginForm />
      </section>
    </main>
  );
}
