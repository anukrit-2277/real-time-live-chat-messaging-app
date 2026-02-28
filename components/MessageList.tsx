"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/formatTimestamp";

const EMOJI_LIST = ["👍", "❤️", "😂", "😮", "😢"];

export default function MessageList({
    conversationId,
    currentUserId,
    currentUserTokenIdentifier,
}: {
    conversationId: Id<"conversations">;
    currentUserId: Id<"users">;
    currentUserTokenIdentifier: string;
}) {
    const rawMessages = useQuery(api.messages.list, { conversationId });
    const messages = rawMessages ?? [];
    const deleteMessage = useMutation(api.messages.deleteMessage);
    const toggleReaction = useMutation(api.reactions.toggle);
    const bottomRef = useRef<HTMLDivElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isNearBottom, setIsNearBottom] = useState(true);
    const [showNewMsgButton, setShowNewMsgButton] = useState(false);
    const [openEmojiPicker, setOpenEmojiPicker] = useState<string | null>(null);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
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

    // Reset state when switching conversations
    useEffect(() => {
        prevMessageCountRef.current = messages.length;
        setShowNewMsgButton(false);
        setIsNearBottom(true);
        setOpenEmojiPicker(null);
        setDeleteConfirmId(null);
        bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }, [conversationId]);

    // Auto-scroll logic: scroll if near bottom, otherwise show button
    useEffect(() => {
        const newCount = messages.length;
        const prevCount = prevMessageCountRef.current;
        prevMessageCountRef.current = newCount;

        if (newCount > prevCount && prevCount > 0) {
            // New messages arrived (prevCount > 0 ensures we skip the initial load)
            if (isNearBottom) {
                bottomRef.current?.scrollIntoView({ behavior: "smooth" });
            } else {
                setShowNewMsgButton(true);
            }
        }
    }, [messages.length, isNearBottom]);

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        setShowNewMsgButton(false);
    };

    // Skeleton loader while messages are loading
    if (rawMessages === undefined) {
        return (
            <div className="flex flex-1 flex-col overflow-hidden relative z-10 p-4 md:p-6 space-y-4">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className={`flex ${i % 2 === 0 ? "justify-start" : "justify-end"}`}>
                        <div
                            className="rounded-2xl animate-pulse"
                            style={{
                                background: i % 2 === 0 ? "rgba(255,255,255,0.5)" : "rgba(60,145,197,0.15)",
                                width: `${120 + (i % 3) * 60}px`,
                                height: "52px",
                            }}
                        />
                    </div>
                ))}
            </div>
        );
    }

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
                                className={`flex animate-fade-in group ${isMine ? "justify-end" : "justify-start"}`}
                            >
                                {/* Delete button for own messages (shows on hover, to the left) */}
                                {isMine && !msg.deleted && (
                                    <button
                                        onClick={() => setDeleteConfirmId(msg._id)}
                                        className="self-center mr-1.5 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-red-50"
                                        style={{ color: "#94a3b8" }}
                                        title="Delete message"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                        </svg>
                                    </button>
                                )}
                                <div className={`flex flex-col ${isMine ? "items-end" : "items-start"}`}>
                                    {/* Message bubble */}
                                    <div>
                                        <div
                                            className={`max-w-xs lg:max-w-md px-5 py-3 rounded-2xl shadow-lg ${isMine ? "text-white" : ""
                                                }`}
                                            style={
                                                isMine
                                                    ? msg.deleted
                                                        ? { background: "linear-gradient(135deg, #94a3b8 0%, #64748b 100%)" }
                                                        : { background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }
                                                    : { background: "rgba(255, 255, 255, 0.8)", backdropFilter: "blur(8px)" }
                                            }
                                        >
                                            {!isMine && (
                                                <p className="mb-1 text-xs font-semibold" style={{ color: "#3C91C5" }}>
                                                    {msg.senderName}
                                                </p>
                                            )}
                                            <p
                                                className={`text-sm leading-relaxed ${msg.deleted ? "italic opacity-70" : ""}`}
                                                style={isMine ? { color: "#ffffff" } : { color: msg.deleted ? "#94a3b8" : "#1E252B" }}
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

                                    {/* React button below the bubble */}
                                    {!msg.deleted && (
                                        <div className="relative">
                                            <button
                                                onClick={() => setOpenEmojiPicker(openEmojiPicker === msg._id ? null : msg._id)}
                                                className="mt-0.5 p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-white/60"
                                                style={{ color: "#94a3b8" }}
                                                title="React"
                                            >
                                                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
                                                </svg>
                                            </button>

                                            {/* Emoji picker popup */}
                                            {openEmojiPicker === msg._id && (
                                                <div
                                                    className={`absolute ${isMine ? "right-0" : "left-0"} top-full mt-1 z-30 flex gap-1 px-2 py-1.5 rounded-full shadow-xl animate-fade-in`}
                                                    style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(0,0,0,0.08)" }}
                                                >
                                                    {EMOJI_LIST.map((emoji) => (
                                                        <button
                                                            key={emoji}
                                                            onClick={() => {
                                                                toggleReaction({
                                                                    messageId: msg._id,
                                                                    tokenIdentifier: currentUserTokenIdentifier,
                                                                    emoji,
                                                                });
                                                                setOpenEmojiPicker(null);
                                                            }}
                                                            className="text-lg hover:scale-125 transition-transform duration-150 px-0.5"
                                                        >
                                                            {emoji}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Reaction counts */}
                                    {msg.reactions && msg.reactions.length > 0 && (
                                        <div className={`flex gap-1 mt-1 flex-wrap ${isMine ? "justify-end" : "justify-start"}`}>
                                            {msg.reactions.map((data) => {
                                                const reacted = data.userIds.includes(currentUserId);
                                                return (
                                                    <button
                                                        key={data.emoji}
                                                        onClick={() =>
                                                            toggleReaction({
                                                                messageId: msg._id,
                                                                tokenIdentifier: currentUserTokenIdentifier,
                                                                emoji: data.emoji,
                                                            })
                                                        }
                                                        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs transition-all duration-200 hover:scale-105 ${reacted ? "ring-1" : ""
                                                            }`}
                                                        style={{
                                                            background: reacted ? "rgba(60, 145, 197, 0.15)" : "rgba(255,255,255,0.7)",
                                                            border: "1px solid rgba(0,0,0,0.06)",
                                                            color: "#475569",
                                                            ...(reacted ? { ringColor: "#3C91C5" } : {}),
                                                        }}
                                                    >
                                                        <span>{data.emoji}</span>
                                                        <span className="font-medium">{data.count}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
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

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div
                        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl p-6 animate-fade-in"
                        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}
                    >
                        <div className="flex flex-col items-center text-center">
                            <div
                                className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                                style={{ background: "rgba(239, 68, 68, 0.1)" }}
                            >
                                <svg className="w-6 h-6" style={{ color: "#ef4444" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold mb-1" style={{ color: "#1E252B" }}>Delete Message</h3>
                            <p className="text-sm mb-5" style={{ color: "#64748B" }}>
                                This message will be deleted for everyone.
                            </p>
                            <div className="flex gap-3 w-full">
                                <button
                                    onClick={() => setDeleteConfirmId(null)}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 hover:bg-gray-100"
                                    style={{ color: "#475569", border: "1px solid rgba(0,0,0,0.1)" }}
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        try {
                                            await deleteMessage({
                                                messageId: deleteConfirmId as any,
                                                tokenIdentifier: currentUserTokenIdentifier,
                                            });
                                        } catch (err) {
                                            console.error("Delete failed:", err);
                                        }
                                        setDeleteConfirmId(null);
                                    }}
                                    className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                                    style={{ background: "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)" }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
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
