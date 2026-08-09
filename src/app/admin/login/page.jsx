"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { FiCheck, FiEye, FiEyeOff } from "react-icons/fi";

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || "";

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordRules = useMemo(() => {
    const hasMinLength = password.length >= 12;
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[^A-Za-z0-9]/.test(password);

    return [
      { label: "Minimum 12 characters", passed: hasMinLength },
      { label: "At least 1 uppercase letter", passed: hasUppercase },
      { label: "At least 1 lowercase letter", passed: hasLowercase },
      { label: "At least 1 number", passed: hasNumber },
      { label: "At least 1 symbol", passed: hasSymbol },
    ];
  }, [password]);

  const handleGoogleSignIn = async () => {
    setError("");
    setGoogleLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}${BASE_PATH}/admin/dashboard`,
      },
    });

    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleEmailSignIn = async (event) => {
    event.preventDefault();

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      // Determine whether the email exists by calling a secure server endpoint
      try {
        const resp = await fetch('/api/admin/check-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email.trim() }),
        });
        const json = await resp.json();

        if (resp.ok && typeof json.exists !== 'undefined') {
          if (json.exists) {
            // Email exists but sign-in failed
            setError('Incorrect password.');
          } else {
            // Email not found
            setError('Incorrect email ID. No account found with that email.');
          }
        } else if (json && json.error) {
          // Server route exists but reported a configuration problem
          console.error('check-user error:', json.error);
          setError('Unable to verify credentials (server misconfigured). Possible incorrect email or password.');
        } else {
          // Unknown response
          console.error('check-user unexpected response:', resp.status, json);
          setError('Unable to verify credentials. Possible incorrect email or password.');
        }
      } catch (err) {
        console.error('Error checking user existence', err);
        setError('Unable to verify credentials. Possible incorrect email or password.');
      }

      setLoading(false);
      return;
    }

    if (data?.session) {
      router.push("/admin/dashboard");
    } else {
      setError("Unable to sign in. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[70vh] flex items-center justify-center bg-orange-50 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-orange-100 bg-white p-8 shadow-lg">
        {error && <p className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-orange-700">Admin Login</h1>
          <p className="mt-2 text-sm text-gray-500">
            Welcome kiranaprakashsharma9 Srirangapatana Purohit 🙏🏻.
          </p>
        </div>

        <form onSubmit={handleEmailSignIn} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
              placeholder="admin@example.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 pr-10 text-sm text-gray-900 outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-200"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-orange-600"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
            </div>

            <ul className="mt-3 space-y-2 rounded-lg border border-orange-100 bg-orange-50/70 p-3 text-sm">
              {passwordRules.map((rule) => (
                <li key={rule.label} className="flex items-center gap-2">
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded-full ${
                      rule.passed ? "bg-green-600 text-white" : "bg-gray-300 text-gray-600"
                    }`}
                  >
                    <FiCheck size={12} />
                  </span>
                  <span className={rule.passed ? "text-green-700" : "text-gray-600"}>
                    {rule.label}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-orange-600 px-4 py-2.5 font-semibold text-white transition hover:bg-orange-700 disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in with Email"}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3">
          <div className="h-px flex-1 bg-gray-200" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">Or</span>
          <div className="h-px flex-1 bg-gray-200" />
        </div>

        <button
          onClick={handleGoogleSignIn}
          disabled={googleLoading}
          className="flex w-full items-center justify-center gap-3 rounded-md border border-gray-300 bg-white px-4 py-2.5 font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60"
        >
          <svg className="h-5 w-5" viewBox="0 0 48 48" aria-hidden="true">
            <path
              fill="#FFC107"
              d="M43.6 20.5H42V20H24v8h11.3C33.9 32.9 29.4 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.7-.4-3.5z"
            />
            <path
              fill="#FF3D00"
              d="M6.3 14.7l6.6 4.8C14.6 15.9 18.9 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.6 6.1 29.6 4 24 4c-7.6 0-14.1 4.3-17.4 10.6z"
            />
            <path
              fill="#4CAF50"
              d="M24 44c5.3 0 10.2-2 13.9-5.4l-6.4-5.4C29.4 35 26.8 36 24 36c-5.3 0-9.8-3.1-11.4-7.7l-6.5 5C9.7 39.6 16.3 44 24 44z"
            />
            <path
              fill="#1976D2"
              d="M43.6 20.5H42V20H24v8h11.3c-.8 2.3-2.3 4.3-4.2 5.7l6.4 5.4C39.9 37 44 31.1 44 24c0-1.3-.1-2.7-.4-3.5z"
            />
          </svg>
          {googleLoading ? "Redirecting..." : "Sign in with Google"}
        </button>

      </div>
    </main>
  );
}
