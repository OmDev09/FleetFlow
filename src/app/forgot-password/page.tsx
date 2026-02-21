"use client";

import { useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSent(true);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md card p-8 shadow-lg">
        <h1 className="text-xl font-bold text-slate-900">Forgot password</h1>
        <p className="text-slate-600 mt-1 text-sm">
          Enter your email and we’ll send a reset link. (Demo: no email sent.)
        </p>
        {sent ? (
          <p className="mt-4 text-teal-600 text-sm">
            If an account exists for {email}, you would receive a reset link.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field"
              placeholder="Email"
              required
            />
            <button type="submit" className="btn-primary w-full">
              Send reset link
            </button>
          </form>
        )}
        <Link href="/login" className="mt-4 inline-block text-sm text-teal-600 hover:text-teal-700">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
