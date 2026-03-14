"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";

const PUBLIC_PATHS = ["/login", "/signup", "/forgot-password"];

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [checked, setChecked] = useState(false);
  const [authorized, setAuthorized] = useState(false);

  const check = useCallback(() => {
    const token = localStorage.getItem("access_token");
    const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));

    if (!token && !isPublic) {
      setAuthorized(false);
      setChecked(true);
      router.replace("/login");
      return;
    }

    if (token && isPublic) {
      // Already logged in — bounce away from auth pages
      setAuthorized(false);
      setChecked(true);
      router.replace("/");
      return;
    }

    // All good — either authenticated on a protected page, or on a public page
    setAuthorized(true);
    setChecked(true);
  }, [pathname, router]);

  // Run the check on mount and whenever the pathname changes
  useEffect(() => {
    check();
  }, [check]);

  // While we haven't checked yet, show a minimal loading state
  if (!checked || !authorized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-pulse text-slate-400 text-sm">Loading...</div>
      </div>
    );
  }

  return <>{children}</>;
}
