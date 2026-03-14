"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Box, Eye, EyeOff } from "lucide-react";
import { api, ApiError } from "@/lib/api";

import Logo from '@/components/Logo';

export default function LoginPage() {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<{ username?: string; password?: string }>({});

  const validate = () => {
    const errs: { username?: string; password?: string } = {};
    const val = form.username.trim();

    // If it looks like an email (contains @), enforce valid email format
    if (val.includes("@")) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(val)) {
        errs.username = "Please enter a valid email address.";
      }
    } else if (val.length === 0) {
      errs.username = "Email or username is required.";
    }

    if (form.password.length < 8) {
      errs.password = "Password must be at least 8 characters.";
    }

    return errs;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    setLoading(true);
    try {
      const res = await api.auth.login(form);
      localStorage.setItem("access_token", res.access);
      localStorage.setItem("refresh_token", res.refresh);
      localStorage.setItem("user", JSON.stringify(res.user));

      // Verify token was persisted
      console.log("access_token saved:", localStorage.getItem("access_token"));

      // Full page navigation so ProtectedRoute reads the fresh token on mount
      window.location.href = "/";
    } catch (err) {
      const apiErr = err as ApiError;
      const msg =
        (apiErr.body?.detail as string) ||
        (apiErr.body?.non_field_errors as string[])?.join(", ") ||
        "Login failed. Please check your credentials.";
      setError(msg);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-6">
          <Logo className="w-14 h-14 mb-2 drop-shadow-sm" />
          <div className="flex flex-col items-center">
            <span className="text-[28px] font-bold text-slate-900 leading-none tracking-tight">Inventory</span>
            <span className="text-xs font-bold text-blue-600 tracking-[0.2em] uppercase mt-1">Management System</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
          <h1 className="text-xl font-semibold text-slate-900 mb-1">Welcome back</h1>
          <p className="text-sm text-slate-500 mb-6">Sign in to your account</p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                required
                value={form.username}
                onChange={(e) => { setForm({ ...form, username: e.target.value }); setFieldErrors(f => ({ ...f, username: undefined })); }}
                className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent ${fieldErrors.username ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                placeholder="you@example.com"
              />
              {fieldErrors.username && <p className="mt-1 text-xs text-red-600">{fieldErrors.username}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={form.password}
                  onChange={(e) => { setForm({ ...form, password: e.target.value }); setFieldErrors(f => ({ ...f, password: undefined })); }}
                  className={`w-full px-3 py-2 rounded-lg border text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-10 ${fieldErrors.password ? 'border-red-400 bg-red-50' : 'border-slate-300'}`}
                  placeholder="Min. 8 characters"
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {fieldErrors.password && <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>}
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-blue-600 hover:text-blue-700 font-medium"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-medium rounded-lg text-sm transition-colors"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-blue-600 hover:text-blue-700 font-medium">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
