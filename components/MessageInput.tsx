"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";

export default function MessageInput({
    conversationId,
    senderTokenIdentifier,
}: {
    conversationId: Id<"conversations">;
    senderTokenIdentifier: string;
}) {
    const [text, setText] = useState("");
    const sendMessage = useMutation(api.messages.send);

    const handleSend = async () => {
        const trimmed = text.trim();
        if (!trimmed) return;

        setText("");
        await sendMessage({
            conversationId,
            senderTokenIdentifier,
            body: trimmed,
        });
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="flex items-center gap-2 border-t px-4 py-3">
            <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message..."
                className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
                onClick={handleSend}
                disabled={!text.trim()}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
            >
                Send
            </button>
        </div>
    );
}
