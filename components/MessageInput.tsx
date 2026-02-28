"use client";

import { useState, useRef, useCallback, useEffect } from "react";
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
    const setTyping = useMutation(api.typing.setTyping);
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Cleanup: clear typing status when unmounting or switching conversations
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            setTyping({
                conversationId,
                tokenIdentifier: senderTokenIdentifier,
                isTyping: false,
            });
        };
    }, [conversationId, senderTokenIdentifier, setTyping]);

    const [sendError, setSendError] = useState<string | null>(null);
    const [failedMessage, setFailedMessage] = useState<string | null>(null);

    // Fire typing=true on each keystroke, then typing=false after 2s of inactivity
    const handleTyping = useCallback(() => {
        setTyping({
            conversationId,
            tokenIdentifier: senderTokenIdentifier,
            isTyping: true,
        });

        // Clear any existing timeout
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }

        // Set typing=false after 2 seconds of no keystrokes
        typingTimeoutRef.current = setTimeout(() => {
            setTyping({
                conversationId,
                tokenIdentifier: senderTokenIdentifier,
                isTyping: false,
            });
        }, 2000);
    }, [conversationId, senderTokenIdentifier, setTyping]);

    const handleSend = async (retryBody?: string) => {
        const trimmed = retryBody ?? text.trim();
        if (!trimmed) return;

        setSendError(null);
        setFailedMessage(null);

        // Clear typing status immediately on send
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        setTyping({
            conversationId,
            tokenIdentifier: senderTokenIdentifier,
            isTyping: false,
        });

        if (!retryBody) setText("");

        try {
            await sendMessage({
                conversationId,
                senderTokenIdentifier,
                body: trimmed,
            });
        } catch {
            setSendError("Failed to send message");
            setFailedMessage(trimmed);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setText(e.target.value);
        if (e.target.value.trim()) {
            handleTyping();
        }
    };

    return (
        <div
            className="border-t border-white/20 px-4 py-3 relative z-10"
            style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(12px)" }}
        >
            {/* Error bar with retry */}
            {sendError && (
                <div
                    className="flex items-center justify-between mb-2 px-3 py-2 rounded-lg text-xs animate-fade-in"
                    style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.2)", color: "#dc2626" }}
                >
                    <span>⚠ {sendError}</span>
                    <button
                        onClick={() => failedMessage && handleSend(failedMessage)}
                        className="font-semibold px-2 py-0.5 rounded-md transition-colors hover:bg-red-100"
                    >
                        Retry
                    </button>
                </div>
            )}
            <div className="flex items-center gap-3">
                <input
                    type="text"
                    value={text}
                    onChange={handleChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    className="flex-1 rounded-xl border border-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
                    style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        color: "#1E252B",
                    }}
                />
                <button
                    onClick={() => handleSend()}
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
