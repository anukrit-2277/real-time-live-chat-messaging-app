"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/formatTimestamp";

export default function MessageList({
    conversationId,
    currentUserId,
    currentUserTokenIdentifier,
}: {
    conversationId: Id<"conversations">;
    currentUserId: Id<"users">;
    currentUserTokenIdentifier: string;
}) {
    const messages =
        useQuery(api.messages.list, { conversationId }) ?? [];
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [showNewMsgButton, setShowNewMsgButton] = useState(false);
    const prevMessageCountRef = useRef(messages.length);

    // Typing indicator
    const typers = useQuery(api.typing.getTyping, {
        conversationId,
        tokenIdentifier: currentUserTokenIdentifier,
    }) ?? [];

    // Track scroll position
    const handleScroll = useCallback(() => {
        const container = containerRef.current;
        if (!container) return;

        const threshold = 150; // pixels from bottom
        const distanceFromBottom =
            container.scrollHeight - container.scrollTop - container.clientHeight;
        const nearBottom = distanceFromBottom < threshold;

        setIsNearBottom(nearBottom);
        if (nearBottom) {
            setShowNewMsgButton(false);
        }
    }, []);

    // Auto-scroll logic: scroll if near bottom, otherwise show button
    useEffect(() => {
        const newCount = messages.length;
        const prevCount = prevMessageCountRef.current;
        prevMessageCountRef.current = newCount;

        if (newCount > prevCount) {
            // New messages arrived
            if (isNearBottom) {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
                setShowNewMsgButton(true);
            }
        }
    }, [messages.length, isNearBottom]);

    // Initial scroll to bottom on first load
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }, [conversationId]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowNewMsgButton(false);
    };

    // Empty state: no messages yet
    if (messages.length === 0) {
        return (
            <div className="flex flex-1 flex-col relative z-10">
                <div className="flex flex-1 items-center justify-center">
                    <div className="text-center animate-fade-in">
                        <div
                            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 glass shadow-lg"
                            style={{ background: "rgba(60, 145, 197, 0.1)" }}
                        >
                            <svg className="w-8 h-8" style={{ color: "#3C91C5" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                            </svg>
                        </div>
                        <h3 className="text-lg font-semibold mb-1" style={{ color: "#1E252B" }}>
                            Start Your Conversation
                        </h3>
                        <p className="text-sm" style={{ color: "#475569" }}>
                            No messages yet. Say hello!
                        </p>
                    </div>
                </div>
                {/* Typing indicator even when no messages */}
                {typers.length > 0 && (
                    <div className="px-4 md:px-6 pb-2">
                        <TypingIndicator typers={typers} />
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-hidden relative z-10">
            <div
                ref={containerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar"
            >
                {messages.map((msg, index) => {
                    const isMine = msg.senderId === currentUserId;

                    // Date separator: show when day changes between messages
                    const prevMsg = index > 0 ? messages[index - 1] : null;
                    const showDateSeparator =
                        !prevMsg || getDayKey(msg._creationTime) !== getDayKey(prevMsg._creationTime);

                    return (
                        <div key={msg._id}>
                            {showDateSeparator && (
                                <div className="flex justify-center my-3">
                                    <span
                                        className="px-4 py-1 rounded-full text-xs font-medium shadow-sm"
                                        style={{
                                            background: "rgba(255, 255, 255, 0.85)",
                                            backdropFilter: "blur(8px)",
                                            color: "#475569",
                                        }}
                                    >
                                        {getDateLabel(msg._creationTime)}
                                    </span>
                                </div>
                            )}
                            <div
                                className={`flex animate-fade-in ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-lg ${isMine ? "text-white" : ""
                                        }`}
                                    style={
                                        isMine
                                            ? { background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }
                                            : { background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(8px)" }
                                    }
                                >
                                    {!isMine && (
                                        <p className="mb-1 text-xs font-semibold" style={{ color: "#3C91C5" }}>
                                            {msg.senderName}
                                        </p>
                                    )}
                                    <p
                                        className="text-sm leading-relaxed"
                                        style={isMine ? { color: "#ffffff" } : { color: "#1E252B" }}
                                    >
                                        {msg.body}
                                    </p>
                                    <p
                                        className="mt-1.5 text-xs"
                                        style={{ color: isMine ? "rgba(255,255,255,0.7)" : "#64748B" }}
                                    >
                                        {formatTimestamp(msg._creationTime)}
                                    </p>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Typing indicator */}
                {typers.length > 0 && (
                    <TypingIndicator typers={typers} />
                )}

                <div ref={bottomRef} />
            </div>

            {/* "New messages" button when scrolled up */}
            {showNewMsgButton && (
                <button
                    onClick={scrollToBottom}
                    className="absolute bottom-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded-full text-sm font-medium text-white shadow-xl transition-all duration-300 hover:scale-105 animate-fade-in z-20"
                    style={{ background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }}
                >
                    <svg className="w-4 h-4 inline mr-1" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 13.5 12 21m0 0-7.5-7.5M12 21V3" />
                    </svg>
                    New messages
                </button>
            )}
        </div>
    );
}

// Typing indicator component: shows "Alex is typing..." with pulsing dots
function TypingIndicator({ typers }: { typers: { userId: string; userName: string }[] }) {
    const names = typers.map((t) => t.userName);
    const label =
        names.length === 1
            ? `${names[0]} is typing`
            : `${names.join(", ")} are typing`;

    return (
        <div className="flex items-center gap-2 animate-fade-in">
            <div
                className="px-4 py-2 rounded-2xl shadow-sm"
                style={{ background: "rgba(255, 255, 255, 0.7)", backdropFilter: "blur(8px)" }}
            >
                <div className="flex items-center gap-2">
                    <span className="text-xs" style={{ color: "#64748B" }}>
                        {label}
                    </span>
                    <div className="flex space-x-0.5">
                        <div
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: "#3C91C5" }}
                        />
                        <div
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: "#3C91C5", animationDelay: "0.15s" }}
                        />
                        <div
                            className="w-1.5 h-1.5 rounded-full animate-bounce"
                            style={{ background: "#3C91C5", animationDelay: "0.3s" }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

// Returns a string key representing the calendar day, e.g. "2026-02-28"
function getDayKey(timestamp: number): string {
    const d = new Date(timestamp);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

// Returns a WhatsApp-style date label: "Today", "Yesterday", or "Feb 15" / "Feb 15, 2025"
function getDateLabel(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    if (msgDay.getTime() === today.getTime()) return "Today";
    if (msgDay.getTime() === yesterday.getTime()) return "Yesterday";

    if (date.getFullYear() === now.getFullYear()) {
        return date.toLocaleDateString("en-US", { month: "long", day: "numeric" });
    }

    return date.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}
