"use client";

import { useState } from "react";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { useMutation, useQuery } from "convex/react";
import { useEffect } from "react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import Sidebar from "@/components/Sidebar";
import MessageList from "@/components/MessageList";
import MessageInput from "@/components/MessageInput";

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const storeUser = useMutation(api.users.store);

  const [selectedConversation, setSelectedConversation] =
    useState<Id<"conversations"> | null>(null);

  // Get the current user's Convex document (to get their _id)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn && user ? { tokenIdentifier: user.id } : "skip"
  );

  // Sync user to Convex when signed in
  useEffect(() => {
    if (!isSignedIn || !user) {
      return;
    }
    storeUser({
      name: user.fullName ?? "Anonymous",
      email: user.primaryEmailAddress?.emailAddress ?? "",
      imageUrl: user.imageUrl ?? "",
      tokenIdentifier: user.id,
    });
  }, [isSignedIn, user, storeUser]);

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
      {/* Header */}
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-xl font-bold">LiveChat</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">
            {user?.fullName ?? "User"}
          </span>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>

      {/* Main area: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          currentUserTokenIdentifier={user.id}
          onSelectConversation={setSelectedConversation}
          selectedConversationId={selectedConversation}
        />

        {/* Chat area */}
        <div className="flex flex-1 flex-col bg-white">
          {selectedConversation && currentUser ? (
            <>
              <MessageList
                conversationId={selectedConversation}
                currentUserId={currentUser._id}
              />
              <MessageInput
                conversationId={selectedConversation}
                senderTokenIdentifier={user.id}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center">
              <p className="text-gray-400">
                Select a user to start chatting
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
