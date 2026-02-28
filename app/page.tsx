"use client";

import { useState } from "react";
import { UserButton, useUser } from "@clerk/nextjs";
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
  const [showMembersModal, setShowMembersModal] = useState(false);

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

  // Auto-mark as read when new messages arrive in the active conversation
  useEffect(() => {
    if (selectedConversation && user && activeConversation) {
      markRead({ conversationId: selectedConversation, tokenIdentifier: user.id });
    }
  }, [selectedConversation, activeConversation?.lastMessageTime, user, markRead]);

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

  // Branded loader component
  const Loader = ({ text = "Loading TarsChat..." }: { text?: string }) => (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center animate-fade-in">
        <img
          src="/tarschat-logo.png"
          alt="TarsChat"
          className="h-16 mx-auto mb-5 drop-shadow-lg"
          style={{ mixBlendMode: "multiply" }}
        />
        <div className="flex space-x-1.5 justify-center mb-4">
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#3C91C5" }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#5A7D95", animationDelay: "0.15s" }} />
          <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#77A3B8", animationDelay: "0.3s" }} />
        </div>
        <p className="text-sm font-medium" style={{ color: "#64748b" }}>{text}</p>
      </div>
    </div>
  );

  // Wait for Clerk to load
  if (!isLoaded) {
    return <Loader />;
  }

  // Not signed in -- landing page
  if (!isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col relative overflow-hidden">

        {/* === First Screen (full viewport) === */}
        <div className="min-h-screen flex flex-col relative">

          {/* ── Navbar ── */}
          <nav
            className="relative z-20 flex items-center justify-between px-6 sm:px-10 h-16 animate-fade-in"
            style={{
              background: "rgba(255, 255, 255, 0.6)",
              backdropFilter: "saturate(180%) blur(20px)",
              WebkitBackdropFilter: "saturate(180%) blur(20px)",
              borderBottom: "1px solid rgba(0, 0, 0, 0.05)",
            }}
          >
            <div className="flex items-center gap-2.5">
              <img
                src="/tarschat-logo.png"
                alt="TarsChat"
                className="h-8 sm:h-9"
                style={{ mixBlendMode: "multiply" }}
              />
              <span className="text-[15px] font-semibold tracking-tight" style={{ color: "#0f172a" }}>
                TarsChat
              </span>
            </div>
            <div className="flex items-center gap-6">
              <a
                href="#features"
                className="text-[13px] font-medium transition-colors duration-200 hover:opacity-70 hidden sm:inline"
                style={{ color: "#475569" }}
              >
                Features
              </a>
              <a
                href="/auth"
                className="px-5 py-2 rounded-full text-[13px] font-semibold text-white transition-all duration-200 ease-out hover:shadow-lg hover:-translate-y-0.5"
                style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
              >
                Login
              </a>
            </div>
          </nav>

          {/* ── Hero section ── */}
          <div className="flex-1 flex items-center relative z-10 px-6 sm:px-10 lg:px-16 py-10 sm:py-16">
            <div className="flex flex-col lg:flex-row items-center gap-8 lg:gap-0 w-full max-w-6xl mx-auto">

              {/* Left: Content */}
              <div className="flex-1 max-w-xl animate-fade-in text-center lg:text-left">
                <h1
                  className="text-4xl sm:text-5xl lg:text-[56px] font-bold leading-[1.1] tracking-tight mb-6"
                  style={{ color: "#1E252B" }}
                >
                  Your Space for
                  <br />
                  <span className="gradient-text">Real-time Chats</span>
                </h1>
                <p
                  className="text-base sm:text-lg leading-relaxed mb-8 max-w-md"
                  style={{ color: "#64748b" }}
                >
                  Connect instantly with anyone, share moments in real-time, and
                  never miss a conversation — all in one place.
                </p>

                <div className="flex flex-col items-center lg:items-start gap-3">
                  <a
                    href="/auth"
                    className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl text-[15px] font-semibold text-white transition-all duration-200 ease-out hover:shadow-xl hover:-translate-y-0.5"
                    style={{ background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }}
                  >
                    Get Started
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
                    </svg>
                  </a>
                  {/* Powered-by badge */}
                  <div
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-[12px] font-medium"
                    style={{
                      background: "rgba(255, 255, 255, 0.6)",
                      border: "1px solid rgba(60, 145, 197, 0.2)",
                      color: "#3C91C5",
                    }}
                  >
                    <span style={{ color: "#64748b" }}>Powered by</span>
                    <span className="font-bold">Convex</span>
                    <span style={{ color: "#cbd5e1" }}>·</span>
                    <span style={{ color: "#64748b" }}>Real-time sync</span>
                  </div>
                </div>
              </div>

              {/* Right: Decorative circles cluster */}
              <div className="relative w-48 h-48 sm:w-72 sm:h-72 lg:w-[400px] lg:h-[400px] flex-shrink-0">
                {/* Large main circle */}
                <div
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-56 h-56 sm:w-64 sm:h-64 lg:w-72 lg:h-72 rounded-full animate-float"
                  style={{ background: "linear-gradient(145deg, #5A7D95, #3C91C5)", opacity: 0.5 }}
                />
                {/* Medium circle */}
                <div
                  className="absolute top-2 right-4 w-24 h-24 sm:w-28 sm:h-28 rounded-full animate-float"
                  style={{ background: "linear-gradient(135deg, #77A3B8, #5A7D95)", opacity: 0.35, animationDelay: "1s" }}
                />
                {/* Small circle */}
                <div
                  className="absolute bottom-8 left-2 w-16 h-16 sm:w-20 sm:h-20 rounded-full animate-float"
                  style={{ background: "linear-gradient(135deg, #3C91C5, #A8DADC)", opacity: 0.4, animationDelay: "2s" }}
                />
                {/* Tiny accent */}
                <div
                  className="absolute top-8 left-8 w-10 h-10 rounded-full"
                  style={{ background: "rgba(60, 145, 197, 0.2)" }}
                />
              </div>
            </div>
          </div>

          {/* ── Floating background circles ── */}
          <div className="floating-circle w-24 h-24 top-20 left-6 opacity-10 hidden lg:block" style={{ background: "linear-gradient(135deg, #94a3b8, #cbd5e1)" }} />
          <div className="floating-circle w-16 h-16 top-12 right-[30%] opacity-8 hidden lg:block" style={{ background: "linear-gradient(135deg, #cbd5e1, #94a3b8)" }} />

          {/* ── Feature cards ── */}
          <div className="relative z-10 px-4 sm:px-10 lg:px-16 pb-8 animate-fade-in">
            <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 0 1 1.037-.443 48.282 48.282 0 0 0 5.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0 0 12 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018Z" />
                    </svg>
                  ),
                  title: "Real-time Messages",
                  color: "#3C91C5",
                  bg: "rgba(60, 145, 197, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  ),
                  title: "Secure & Private",
                  color: "#22c55e",
                  bg: "rgba(34, 197, 94, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  ),
                  title: "Mobile Friendly",
                  color: "#6366f1",
                  bg: "rgba(99, 102, 241, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                  ),
                  title: "Online Status",
                  color: "#f59e0b",
                  bg: "rgba(245, 158, 11, 0.1)",
                },
              ].map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center gap-2.5 p-4 sm:p-5 rounded-2xl text-center transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.55)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center"
                    style={{ background: feature.bg, color: feature.color }}
                  >
                    {feature.icon}
                  </div>
                  <span className="text-xs sm:text-[13px] font-semibold" style={{ color: "#334155" }}>
                    {feature.title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* === Second screen: Why TarsChat? (below the fold) === */}
        <section id="features" className="relative z-10 px-6 sm:px-10 lg:px-16 py-14 sm:py-20 scroll-mt-16">
          <div className="max-w-6xl mx-auto">
            {/* Heading */}
            <div className="text-center mb-10 sm:mb-14 animate-fade-in">
              <h2
                className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight mb-3"
                style={{ color: "#1E252B" }}
              >
                Why TarsChat?
              </h2>
              <p
                className="text-sm sm:text-base max-w-lg mx-auto leading-relaxed"
                style={{ color: "#64748b" }}
              >
                Everything you need for seamless, real-time conversations — beautifully crafted and lightning fast.
              </p>
            </div>

            {/* Feature grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                    </svg>
                  ),
                  title: "Instant Messaging",
                  desc: "Messages delivered in real-time through Convex subscriptions. No polling, no delays — conversations flow as fast as you type.",
                  color: "#3C91C5",
                  bg: "rgba(60, 145, 197, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0" />
                    </svg>
                  ),
                  title: "Smart Notifications",
                  desc: "Unread message badges update in real-time. Know exactly which conversations need your attention without refreshing.",
                  color: "#f59e0b",
                  bg: "rgba(245, 158, 11, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  ),
                  title: "Online Presence",
                  desc: "See who's online with live status indicators. Heartbeat-powered presence detection shows availability in real-time.",
                  color: "#22c55e",
                  bg: "rgba(34, 197, 94, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                    </svg>
                  ),
                  title: "Typing Indicators",
                  desc: "Know when someone is composing a reply. Smooth pulsing animation appears in real-time as the other person types.",
                  color: "#6366f1",
                  bg: "rgba(99, 102, 241, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 1.5H8.25A2.25 2.25 0 0 0 6 3.75v16.5a2.25 2.25 0 0 0 2.25 2.25h7.5A2.25 2.25 0 0 0 18 20.25V3.75a2.25 2.25 0 0 0-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3" />
                    </svg>
                  ),
                  title: "Responsive Design",
                  desc: "Seamless experience on any device. Desktop sidebar layout adapts to a full-screen mobile chat view automatically.",
                  color: "#ec4899",
                  bg: "rgba(236, 72, 153, 0.1)",
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                    </svg>
                  ),
                  title: "Secure Authentication",
                  desc: "Powered by Clerk with social login support. Your identity is verified and your conversations are private and protected.",
                  color: "#5A7D95",
                  bg: "rgba(90, 125, 149, 0.1)",
                },
              ].map((f) => (
                <div
                  key={f.title}
                  className="p-5 sm:p-6 rounded-2xl transition-all duration-200 hover:-translate-y-0.5"
                  style={{
                    background: "rgba(255, 255, 255, 0.55)",
                    border: "1px solid rgba(255, 255, 255, 0.6)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: f.bg, color: f.color }}
                  >
                    {f.icon}
                  </div>
                  <h3 className="text-sm sm:text-[15px] font-bold mb-2" style={{ color: "#1E252B" }}>
                    {f.title}
                  </h3>
                  <p className="text-xs sm:text-[13px] leading-relaxed" style={{ color: "#64748b" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Footer ── */}
        <footer className="relative z-10 flex items-center justify-center px-6 py-4">
          <p className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>
            &copy; {new Date().getFullYear()} TarsChat. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  // Wait for Convex data to load after sign-in
  if (!currentUser || conversations === undefined) {
    return <Loader text="Setting up your chats..." />;
  }

  // Signed in
  return (
    <div className="flex h-screen flex-col">
      {/* Navbar */}
      <header
        className={`sticky top-0 z-20 animate-fade-in ${selectedConversation ? "hidden md:block" : ""}`}
        style={{
          background: "rgba(255, 255, 255, 0.72)",
          backdropFilter: "saturate(180%) blur(20px)",
          WebkitBackdropFilter: "saturate(180%) blur(20px)",
          borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
          boxShadow: "0 1px 2px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div className="flex items-center justify-between px-5 sm:px-6 h-14 sm:h-16">
          {/* Brand */}
          <div className="flex items-center gap-3">
            <img
              src="/tarschat-logo.png"
              alt="TarsChat"
              className="h-9 sm:h-10 transition-transform duration-200 ease-out hover:scale-[1.03]"
              style={{ mixBlendMode: "multiply" }}
            />
            <div className="hidden sm:block w-px h-6" style={{ background: "rgba(0, 0, 0, 0.08)" }} />
            <div>
              <h1 className="text-[15px] sm:text-base font-semibold tracking-tight" style={{ color: "#0f172a" }}>
                TarsChat
              </h1>
              <p className="text-[10px] font-medium tracking-wide uppercase" style={{ color: "#94a3b8", letterSpacing: "0.08em" }}>
                Messaging
              </p>
            </div>
          </div>

          {/* User controls */}
          <div className="flex items-center gap-2.5">
            <div
              className="hidden sm:flex items-center gap-2 pl-2.5 pr-3.5 py-1.5 rounded-full transition-all duration-200 ease-out hover:shadow-sm"
              style={{
                background: "rgba(255, 255, 255, 0.65)",
                border: "1px solid rgba(0, 0, 0, 0.06)",
                boxShadow: "0 1px 2px rgba(0, 0, 0, 0.03)",
              }}
            >
              <div className="relative">
                <div className="w-2 h-2 rounded-full" style={{ background: "#22c55e" }} />
                <div
                  className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
                  style={{ background: "#22c55e", opacity: 0.4, animationDuration: "2s" }}
                />
              </div>
              <span className="text-[13px] font-medium" style={{ color: "#334155" }}>
                {user?.fullName ?? "User"}
              </span>
            </div>
            <div className="transition-transform duration-200 ease-out hover:scale-[1.04]">
              <UserButton afterSignOutUrl="/" />
            </div>
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
              className="p-2 rounded-lg transition-all duration-300 hover:scale-105 flex-shrink-0"
              style={{ color: "#475569" }}
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
              </svg>
            </button>
            <div className="relative flex-shrink-0">
              {activeConversation?.isGroup ? (
                <div
                  onClick={() => setShowMembersModal(true)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform duration-200"
                  style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                  title="View members"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                  </svg>
                </div>
              ) : activeConversation?.otherUserImage ? (
                <img
                  src={activeConversation.otherUserImage}
                  alt={activeConversation.otherUserName ?? "User"}
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-white shadow-sm"
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
                  style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
                >
                  {(activeConversation?.otherUserName ?? "?").charAt(0).toUpperCase()}
                </div>
              )}
              {!activeConversation?.isGroup && activeConversation?.otherUserIsOnline && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <h2 className="text-sm font-semibold truncate" style={{ color: "#1E252B" }}>
                {activeConversation?.isGroup ? activeConversation.groupName : (activeConversation?.otherUserName ?? "Chat")}
              </h2>
              <p className="text-xs truncate" style={{ color: activeConversation?.isGroup ? "#94a3b8" : (activeConversation?.otherUserIsOnline ? "#22c55e" : "#94a3b8") }}>
                {activeConversation?.isGroup
                  ? `${activeConversation.memberCount} members · ${activeConversation.membersOnline} online`
                  : activeConversation?.otherUserIsOnline
                    ? "Online"
                    : activeConversation?.otherUserLastSeen
                      ? `Last seen ${formatLastSeen(activeConversation.otherUserLastSeen)}`
                      : "Offline"}
              </p>
            </div>
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
                  {activeConversation?.isGroup ? (
                    <div
                      onClick={() => setShowMembersModal(true)}
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-110 transition-transform duration-200"
                      style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                      title="View members"
                    >
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                      </svg>
                    </div>
                  ) : activeConversation?.otherUserImage ? (
                    <img
                      src={activeConversation.otherUserImage}
                      alt={activeConversation.otherUserName ?? "User"}
                      className="w-9 h-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                    />
                  ) : (
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white"
                      style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
                    >
                      {(activeConversation?.otherUserName ?? "?").charAt(0).toUpperCase()}
                    </div>
                  )}
                  {!activeConversation?.isGroup && activeConversation?.otherUserIsOnline && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                  )}
                </div>
                <div>
                  <h2 className="text-base font-semibold" style={{ color: "#1E252B" }}>
                    {activeConversation?.isGroup ? activeConversation.groupName : (activeConversation?.otherUserName ?? "Chat")}
                  </h2>
                  <p className="text-xs" style={{ color: activeConversation?.isGroup ? "#94a3b8" : (activeConversation?.otherUserIsOnline ? "#22c55e" : "#94a3b8") }}>
                    {activeConversation?.isGroup
                      ? `${activeConversation.memberCount} members · ${activeConversation.membersOnline} online`
                      : activeConversation?.otherUserIsOnline
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

      {/* Footer */}
      <footer
        className={`animate-fade-in ${selectedConversation ? "hidden md:flex" : "flex"}`}
        style={{
          borderTop: "1px solid rgba(0, 0, 0, 0.05)",
          background: "rgba(255, 255, 255, 0.5)",
          backdropFilter: "saturate(180%) blur(16px)",
          WebkitBackdropFilter: "saturate(180%) blur(16px)",
        }}
      >
        <div className="flex items-center justify-between w-full px-5 sm:px-6 h-10">
          <p className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>
            &copy; {new Date().getFullYear()} TarsChat
          </p>
          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[11px]" style={{ color: "#cbd5e1" }}>Next.js &middot; Convex &middot; Clerk</span>
            <span className="w-px h-3 hidden sm:inline-block" style={{ background: "rgba(0,0,0,0.08)" }} />
            <span className="text-[11px]" style={{ color: "#94a3b8" }}>All rights reserved.</span>
          </div>
        </div>
      </footer>
      {/* Group Members Modal */}
      {showMembersModal && activeConversation?.isGroup && activeConversation.members && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
          <div
            className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6 animate-fade-in"
            style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold" style={{ color: "#1E252B" }}>{activeConversation.groupName}</h3>
                <p className="text-xs" style={{ color: "#94a3b8" }}>{activeConversation.memberCount} members · {activeConversation.membersOnline} online</p>
              </div>
              <button
                onClick={() => setShowMembersModal(false)}
                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                style={{ color: "#94a3b8" }}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-64 overflow-y-auto space-y-1 custom-scrollbar">
              {activeConversation.members.map((member, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
                  style={{ background: "rgba(255,255,255,0.5)" }}
                >
                  <div className="relative flex-shrink-0">
                    {member.imageUrl ? (
                      <img src={member.imageUrl} alt={member.name} className="w-9 h-9 rounded-full object-cover ring-1 ring-white shadow-sm" />
                    ) : (
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold text-white" style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
                        {member.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {member.isOnline && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate" style={{ color: "#1E252B" }}>{member.name}</p>
                    <p className="text-xs" style={{ color: member.isOnline ? "#22c55e" : "#94a3b8" }}>
                      {member.isOnline ? "Online" : "Offline"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
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

