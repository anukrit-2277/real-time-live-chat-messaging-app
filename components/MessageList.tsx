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
            <div className="flex flex-1 items-center justify-center">
                <p className="text-gray-400">No messages yet. Say hello!</p>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col overflow-y-auto p-4">
            {messages.map((msg) => {
                const isMine = msg.senderId === currentUserId;

                return (
                    <div
                        key={msg._id}
                        className={`mb-3 flex ${isMine ? "justify-end" : "justify-start"}`}
                    >
                        <div
                            className={`max-w-xs rounded-lg px-4 py-2 ${isMine
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-200 text-gray-900"
                                }`}
                        >
                            {!isMine && (
                                <p className="mb-1 text-xs font-medium text-gray-600">
                                    {msg.senderName}
                                </p>
                            )}
                            <p className="text-sm">{msg.body}</p>
                            <p
                                className={`mt-1 text-xs ${isMine ? "text-blue-200" : "text-gray-500"
                                    }`}
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
