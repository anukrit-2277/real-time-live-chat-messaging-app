"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { formatTimestamp } from "@/lib/formatTimestamp";

export default function Sidebar({
    currentUserTokenIdentifier,
    onSelectConversation,
    selectedConversationId,
}: {
    currentUserTokenIdentifier: string;
    onSelectConversation: (conversationId: Id<"conversations">) => void;
    selectedConversationId: Id<"conversations"> | null;
}) {
    const [search, setSearch] = useState("");
    const [searchFocused, setSearchFocused] = useState(false);

    // Get existing conversations
    const conversations =
        useQuery(api.conversations.list, {
            tokenIdentifier: currentUserTokenIdentifier,
        }) ?? [];

    // Get all other users for search
    const users =
        useQuery(api.users.getExcludingMe, {
            tokenIdentifier: currentUserTokenIdentifier,
        }) ?? [];

    const createOrGet = useMutation(api.conversations.createOrGet);

    // Show user list when search bar is focused; filter by name when typing
    const showUserList = searchFocused || search.length > 0;
    const filteredUsers = search
        ? users.filter((u) =>
            u.name.toLowerCase().includes(search.toLowerCase())
        )
        : users;

    const handleUserClick = async (userId: Id<"users">) => {
        const conversationId = await createOrGet({
            currentUserTokenIdentifier,
            otherUserId: userId,
        });
        setSearch("");
        setSearchFocused(false);
        onSelectConversation(conversationId);
    };

    return (
        <div
            className="flex h-full w-full flex-col border-r border-white/20 custom-scrollbar"
            style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(12px)" }}
        >
            {/* Search bar */}
            <div className="p-4">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    onFocus={() => setSearchFocused(true)}
                    onBlur={() => {
                        // Delay hiding so click on user can register first
                        setTimeout(() => setSearchFocused(false), 200);
                    }}
                    className="w-full rounded-xl border border-white/30 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 shadow-sm"
                    style={{
                        background: "rgba(255, 255, 255, 0.8)",
                        color: "#1E252B",
                    }}
                />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar px-3">
                {/* User list (shown when search is focused or has text) */}
                {showUserList && (
                    <div className="animate-fade-in">
                        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                            Users
                        </p>
                        {filteredUsers.length === 0 ? (
                            <div className="p-6 text-center">
                                <div
                                    className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-3"
                                    style={{ background: "rgba(60, 145, 197, 0.1)" }}
                                >
                                    <svg className="w-6 h-6" style={{ color: "#94a3b8" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                                    </svg>
                                </div>
                                <p className="text-sm" style={{ color: "#94a3b8" }}>No users found</p>
                            </div>
                        ) : (
                            filteredUsers.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => handleUserClick(user._id)}
                                    className="flex w-full items-center gap-3 px-3 py-3 rounded-xl text-left hover-lift mb-1"
                                    style={{ background: "rgba(255, 255, 255, 0.5)" }}
                                >
                                    <div className="relative flex-shrink-0">
                                        {user.imageUrl ? (
                                            <img
                                                src={user.imageUrl}
                                                alt={user.name}
                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-white shadow-sm"
                                            />
                                        ) : (
                                            <div
                                                className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                                                style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
                                            >
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                        {user.isOnline && (
                                            <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold truncate" style={{ color: "#1E252B" }}>
                                            {user.name}
                                        </p>
                                        <p className="text-xs truncate" style={{ color: user.isOnline ? "#22c55e" : "#94a3b8" }}>
                                            {user.isOnline ? "Online" : `@${user.name.toLowerCase().replace(/\s+/g, "")}`}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Conversation list (hidden when user list is shown) */}
                {!showUserList && (
                    <div>
                        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                            Conversations
                        </p>
                        {conversations.length === 0 ? (
                            <div className="p-6 text-center animate-fade-in">
                                <div
                                    className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-4 glass shadow-lg"
                                    style={{ background: "rgba(60, 145, 197, 0.1)" }}
                                >
                                    <svg className="w-7 h-7" style={{ color: "#3C91C5" }} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 0 1-.825-.242m9.345-8.334a2.126 2.126 0 0 0-.476-.095 48.64 48.64 0 0 0-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0 0 11.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
                                    </svg>
                                </div>
                                <p className="text-sm font-medium" style={{ color: "#475569" }}>
                                    No conversations yet
                                </p>
                                <p className="mt-1 text-xs" style={{ color: "#94a3b8" }}>
                                    Search for a user to start chatting
                                </p>
                            </div>
                        ) : (
                            conversations.map((conv) => {
                                const isActive = selectedConversationId === conv._id;

                                return (
                                    <button
                                        key={conv._id}
                                        onClick={() => onSelectConversation(conv._id)}
                                        className={`flex w-full items-center gap-3 px-3 py-3 rounded-xl text-left mb-1 transition-all duration-300 ${isActive ? "shadow-xl text-white" : "hover-lift"
                                            }`}
                                        style={
                                            isActive
                                                ? { background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }
                                                : { background: "rgba(255, 255, 255, 0.5)" }
                                        }
                                    >
                                        <div className="relative flex-shrink-0">
                                            {conv.otherUserImage ? (
                                                <img
                                                    src={conv.otherUserImage}
                                                    alt={conv.otherUserName}
                                                    className={`h-10 w-10 rounded-full object-cover shadow-sm ${isActive ? "ring-2 ring-white/50" : "ring-2 ring-white"
                                                        }`}
                                                />
                                            ) : (
                                                <div
                                                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold text-white shadow-sm"
                                                    style={{
                                                        background: isActive
                                                            ? "rgba(255,255,255,0.25)"
                                                            : "linear-gradient(135deg, #3C91C5, #5A7D95)",
                                                    }}
                                                >
                                                    {conv.otherUserName.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {conv.otherUserIsOnline && (
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${isActive ? "border-2 border-blue-400" : "border-2 border-white"}`} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p
                                                    className="text-sm font-semibold truncate"
                                                    style={{ color: isActive ? "#ffffff" : "#1E252B" }}
                                                >
                                                    {conv.otherUserName}
                                                </p>
                                                <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                                                    <p
                                                        className="text-xs"
                                                        style={{ color: isActive ? "rgba(255,255,255,0.7)" : "#94a3b8" }}
                                                    >
                                                        {formatTimestamp(conv.lastMessageTime)}
                                                    </p>
                                                    {!isActive && conv.unreadCount > 0 && (
                                                        <span
                                                            className="flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full text-xs font-bold text-white"
                                                            style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
                                                        >
                                                            {conv.unreadCount > 99 ? "99+" : conv.unreadCount}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p
                                                className={`truncate text-xs mt-0.5 ${!isActive && conv.unreadCount > 0 ? "font-semibold" : ""}`}
                                                style={{ color: isActive ? "rgba(255,255,255,0.8)" : (conv.unreadCount > 0 ? "#1E252B" : "#64748B") }}
                                            >
                                                {conv.lastMessageBody ?? "No messages yet"}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

