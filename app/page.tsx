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
import { useHeartbeat } from "@/hooks/useHeartbeat";

export default function Home() {
  const { user, isLoaded, isSignedIn } = useUser();
  const storeUser = useMutation(api.users.store);
  const markRead = useMutation(api.readStatus.markRead);

  const [selectedConversation, setSelectedConversation] =
    useState<Id<"conversations"> | null>(null);

  // When a conversation is selected, mark it as read
  const handleSelectConversation = (conversationId: Id<"conversations">) => {
    setSelectedConversation(conversationId);
    if (user) {
      markRead({ conversationId, tokenIdentifier: user.id });
    }
  };

  // Get the current user's Convex document (to get their _id)
  const currentUser = useQuery(
    api.users.getCurrentUser,
    isSignedIn && user ? { tokenIdentifier: user.id } : "skip"
  );

  // Only fetch conversations after the user is stored in the database.
  // This prevents a new user from briefly seeing stale/empty data.
  const conversations = useQuery(
    api.conversations.list,
    isSignedIn && user && currentUser
      ? { tokenIdentifier: user.id }
      : "skip"
  );

  // Find the active conversation's other user name
  // Send heartbeat while the app is open
  useHeartbeat(isSignedIn && user ? user.id : undefined);

  const activeConversation = conversations?.find(
    (c) => c._id === selectedConversation
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

  // Handle back button on mobile
  const handleBack = () => {
    setSelectedConversation(null);
    // No need to mark read here -- it happens on select
  };

  // Wait for Clerk to load
  if (!isLoaded) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="flex space-x-1 justify-center mb-4">
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#3C91C5" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#5A7D95", animationDelay: "0.1s" }} />
            <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#77A3B8", animationDelay: "0.2s" }} />
          </div>
          <p style={{ color: "#475569" }}>Loading...</p>
        </div>
      </div>
    );
  }

  // Not signed in
  if (!isSignedIn) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-6 relative px-4">
        {/* Floating decorative circles */}
        <div className="floating-circle w-32 h-32 top-20 left-10 opacity-10 hidden sm:block" style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }} />
        <div className="floating-circle w-24 h-24 top-40 right-20 opacity-15 hidden sm:block" style={{ background: "linear-gradient(135deg, #5A7D95, #3C91C5)" }} />
        <div className="floating-circle w-20 h-20 bottom-32 left-1/4 opacity-20 hidden sm:block" style={{ background: "linear-gradient(135deg, #5A7D95, #77A3B8)" }} />

        <div className="text-center animate-fade-in z-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-2 gradient-text">LiveChat</h1>
          <p className="mb-8 text-sm sm:text-base" style={{ color: "#475569" }}>Sign in to start messaging</p>
          <SignInButton mode="modal">
            <button
              className="px-6 sm:px-8 py-3 text-white rounded-xl hover:shadow-xl transition-all duration-300 hover:-translate-y-1 font-semibold text-sm sm:text-base"
              style={{ background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }}
            >
              Sign In
            </button>
          </SignInButton>
        </div>
      </div>
    );
  }

  // Signed in
  return (
    <div className="flex h-screen flex-col">
      {/* Header -- hidden on mobile when viewing a chat */}
      <header
        className={`sticky top-0 z-10 border-b border-white/20 ${selectedConversation ? "hidden md:block" : ""
          }`}
        style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)" }}
      >
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4">
          <h1 className="text-lg sm:text-xl font-bold gradient-text">LiveChat</h1>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-xs sm:text-sm font-medium hidden sm:inline" style={{ color: "#475569" }}>
              {user?.fullName ?? "User"}
            </span>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Mobile chat header with back button */}
      {selectedConversation && (
        <header
          className="sticky top-0 z-10 border-b border-white/20 md:hidden"
          style={{ background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)" }}
        >
          <div className="flex items-center gap-3 px-4 py-3">
            <button
              onClick={handleBack}
              className="p-2 rounded-lg transition-all duration-300 hover:scale-105"
              style={{ color: "#475569" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                {activeConversation?.otherUserImage ? (
                  <img
                    src={activeConversation.otherUserImage}
                    alt={activeConversation.otherUserName}
                    className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                  />
                ) : (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
                  >
                    {activeConversation?.otherUserName?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                )}
                {activeConversation?.otherUserIsOnline && (
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div className="min-w-0">
                <h2 className="text-base font-semibold truncate" style={{ color: "#1E252B" }}>
                  {activeConversation?.otherUserName ?? "Chat"}
                </h2>
                <p className="text-xs" style={{ color: activeConversation?.otherUserIsOnline ? "#22c55e" : "#94a3b8" }}>
                  {activeConversation?.otherUserIsOnline
                    ? "Online"
                    : activeConversation?.otherUserLastSeen
                      ? `Last seen ${formatLastSeen(activeConversation.otherUserLastSeen)}`
                      : "Offline"}
                </p>
              </div>
            </div>
            <UserButton afterSignOutUrl="/" />
          </div>
        </header>
      )}

      {/* Main area: sidebar + chat */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar -- full width on mobile, fixed width on desktop */}
        {/* On mobile: shown when no conversation is selected */}
        {/* On desktop: always shown */}
        <div
          className={`${selectedConversation ? "hidden md:flex" : "flex"
            } w-full md:w-80 flex-shrink-0`}
        >
          <Sidebar
            currentUserTokenIdentifier={user.id}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation}
          />
        </div>

        {/* Chat area */}
        {/* On mobile: shown when a conversation is selected (full screen) */}
        {/* On desktop: always shown */}
        <div
          className={`${selectedConversation ? "flex" : "hidden md:flex"
            } flex-1 flex-col relative`}
        >
          {/* Floating decorative circles in chat area */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="floating-circle w-32 h-32 top-20 right-10 opacity-5" style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }} />
            <div className="floating-circle w-20 h-20 bottom-32 left-1/4 opacity-8" style={{ background: "linear-gradient(135deg, #5A7D95, #77A3B8)" }} />
          </div>

          {selectedConversation && currentUser ? (
            <>
              {/* Desktop chat header with other user's name */}
              <div
                className="hidden md:flex items-center gap-3 px-6 py-3 border-b border-white/20"
                style={{ background: "rgba(255,255,255,0.6)", backdropFilter: "blur(12px)" }}
              >
                <div className="relative flex-shrink-0">
                  {activeConversation?.otherUserImage ? (
                    <img
                      src={activeConversation.otherUserImage}
                      alt={activeConversation.otherUserName}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
                    >
                      {activeConversation?.otherUserName?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                  )}
                  {activeConversation?.otherUserIsOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: "#1E252B" }}>
                    {activeConversation?.otherUserName ?? "Chat"}
                  </h2>
                  <p className="text-xs" style={{ color: activeConversation?.otherUserIsOnline ? "#22c55e" : "#94a3b8" }}>
                    {activeConversation?.otherUserIsOnline
                      ? "Online"
                      : activeConversation?.otherUserLastSeen
                        ? `Last seen ${formatLastSeen(activeConversation.otherUserLastSeen)}`
                        : "Offline"}
                  </p>
                </div>
              </div>

              <MessageList
                conversationId={selectedConversation}
                currentUserId={currentUser._id}
                currentUserTokenIdentifier={user.id}
              />
              <MessageInput
                conversationId={selectedConversation}
                senderTokenIdentifier={user.id}
              />
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center relative z-10">
              <div className="text-center animate-fade-in px-4">
                <div
                  className="w-16 sm:w-20 h-16 sm:h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 glass shadow-xl"
                  style={{ background: "rgba(60, 145, 197, 0.1)" }}
                >
                  <svg className="w-8 sm:w-10 h-8 sm:h-10" style={{ color: "#3C91C5" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                  </svg>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: "#1E252B" }}>
                  Select a conversation
                </h2>
                <p className="text-sm sm:text-base" style={{ color: "#475569" }}>
                  Search for a user to start chatting
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Formats a lastSeen timestamp into a human-readable relative time
function formatLastSeen(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;

  return new Date(timestamp).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
