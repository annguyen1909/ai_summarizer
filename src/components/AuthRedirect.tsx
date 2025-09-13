"use client";

import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AuthRedirect() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      // If user is signed in but on the home page, redirect to dashboard
      if (window.location.pathname === '/') {
        router.push('/dashboard');
      }
    }
  }, [isSignedIn, isLoaded, router]);

  return null;
}