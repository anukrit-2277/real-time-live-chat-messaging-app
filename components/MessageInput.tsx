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
        <div
            className="border-t border-white/20 px-4 py-3 relative z-10"
            style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(12px)" }}
        >
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 shadow-sm"
                    style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        color: "#1E252B",
                    }}
                />
                <button
                    onClick={handleSend}
                    disabled={!text.trim()}
                    className="rounded-xl px-5 py-2.5 text-sm text-white font-semibold transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                    style={{ background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }}
                >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.126A59.768 59.768 0 0 1 21.485 12 59.77 59.77 0 0 1 3.27 20.876L5.999 12Zm0 0h7.5" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
