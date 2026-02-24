"use client";

import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useConvexAuth, useMutation } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const { isAuthenticated: isConvexAuthed } = useConvexAuth();
  const storeUser = useMutation(api.users.store);

  // Sync user to Convex when authenticated
  useEffect(() => {
    if (!isConvexAuthed) {
      return;
    }
    storeUser();
  }, [isConvexAuthed, storeUser]);

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4">
        <h1 className="text-3xl font-bold">LiveChat</h1>
        <p className="text-gray-500">Sign in to start messaging</p>
        <SignInButton mode="modal">
          <button className="rounded-md bg-blue-600 px-6 py-2 text-white hover:bg-blue-700">
            Sign In
          </button>
        </SignInButton>
      </div>
    );
  }

  // Signed in
  return (
    <div className="flex h-screen flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-bold">LiveChat</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user?.fullName ?? "User"}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center">
        <p className="text-gray-500">
          Welcome, {user?.firstName ?? "User"}! You are signed in.
        </p>
      </main>
    </div>
  );
}
