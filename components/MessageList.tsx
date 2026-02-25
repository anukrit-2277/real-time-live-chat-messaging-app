"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/formatTimestamp";

export default function MessageList({
    conversationId,
    currentUserId,
}: {
    conversationId: Id<"conversations">;
    currentUserId: Id<"users">;
}) {
    const messages =
        useQuery(api.messages.list, { conversationId }) ?? [];
    const bottomRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom when new messages arrive
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages.length]);

    // Empty state: no messages yet
    if (messages.length === 0) {
        return (
            <div className="flex flex-1 items-center justify-center relative z-10">
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
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar relative z-10">
            {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;

                return (
                    <div
                        key={msg._id}
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
                );
            })}
            <div ref={bottomRef} />
        </div>
    );
}
