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

    // Group creation state
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState("");
    const [selectedMembers, setSelectedMembers] = useState<Id<"users">[]>([]);

    // Get existing conversations
    const rawConversations = useQuery(api.conversations.list, {
        tokenIdentifier: currentUserTokenIdentifier,
    });
    const conversations = rawConversations ?? [];

    // Get all other users for search
    const users =
        useQuery(api.users.getExcludingMe, {
            tokenIdentifier: currentUserTokenIdentifier,
        }) ?? [];

    const createOrGet = useMutation(api.conversations.createOrGet);
    const createGroup = useMutation(api.conversations.createGroup);

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

    const handleCreateGroup = async () => {
        if (!groupName.trim() || selectedMembers.length === 0) return;
        const conversationId = await createGroup({
            currentUserTokenIdentifier,
            name: groupName.trim(),
            memberIds: selectedMembers,
        });
        setShowGroupModal(false);
        setGroupName("");
        setSelectedMembers([]);
        onSelectConversation(conversationId);
    };

    const toggleMember = (userId: Id<"users">) => {
        setSelectedMembers((prev) =>
            prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
        );
    };

    return (
        <div
            className="flex h-full w-full flex-col border-r border-white/20 custom-scrollbar"
            style={{ background: "rgba(255, 255, 255, 0.6)", backdropFilter: "blur(12px)" }}
        >
            {/* Search bar + New Group button */}
            <div className="p-4 space-y-3">
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
                <button
                    onClick={() => setShowGroupModal(true)}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:shadow-md hover:-translate-y-0.5"
                    style={{
                        background: "rgba(60, 145, 197, 0.1)",
                        color: "#3C91C5",
                        border: "1px solid rgba(60, 145, 197, 0.2)",
                    }}
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                    </svg>
                    New Group
                </button>
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
                                    className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left transition-all duration-300 mb-1 hover-lift"
                                    style={{ background: "rgba(255, 255, 255, 0.5)" }}
                                >
                                    <div className="relative flex-shrink-0">
                                        {user.imageUrl ? (
                                            <img
                                                src={user.imageUrl}
                                                alt={user.name}
                                                className="h-9 w-9 rounded-full object-cover ring-2 ring-white shadow-sm"
                                            />
                                        ) : (
                                            <div
                                                className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold text-white"
                                                style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
                                            >
                                                {user.name.charAt(0).toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <p className="text-sm font-semibold" style={{ color: "#1E252B" }}>{user.name}</p>
                                        <p className="text-xs" style={{ color: "#94a3b8" }}>{user.email}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Conversation list */}
                {!showUserList && (
                    <div>
                        <p className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: "#64748B" }}>
                            Conversations
                        </p>
                        {rawConversations === undefined ? (
                            /* Skeleton loader */
                            <div className="space-y-2 px-2">
                                {[...Array(3)].map((_, i) => (
                                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl animate-pulse">
                                        <div className="w-10 h-10 rounded-full" style={{ background: "rgba(60,145,197,0.1)" }} />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-3 rounded-full w-24" style={{ background: "rgba(60,145,197,0.1)" }} />
                                            <div className="h-2.5 rounded-full w-32" style={{ background: "rgba(60,145,197,0.06)" }} />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : conversations.length === 0 ? (
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
                                            {conv.isGroup ? (
                                                /* Group avatar: stacked circles */
                                                <div
                                                    className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white shadow-sm ${isActive ? "ring-2 ring-white/50" : "ring-2 ring-white"}`}
                                                    style={{ background: isActive ? "rgba(255,255,255,0.25)" : "linear-gradient(135deg, #6366f1, #8b5cf6)" }}
                                                >
                                                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z" />
                                                    </svg>
                                                </div>
                                            ) : conv.otherUserImage ? (
                                                <img
                                                    src={conv.otherUserImage}
                                                    alt={conv.otherUserName ?? "User"}
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
                                                    {(conv.otherUserName ?? "?").charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                            {!conv.isGroup && conv.otherUserIsOnline && (
                                                <span className={`absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full ${isActive ? "border-2 border-blue-400" : "border-2 border-white"}`} />
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center justify-between">
                                                <p
                                                    className="text-sm font-semibold truncate"
                                                    style={{ color: isActive ? "#ffffff" : "#1E252B" }}
                                                >
                                                    {conv.isGroup ? conv.groupName : conv.otherUserName}
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
                                            <div className="flex items-center gap-1.5">
                                                {conv.isGroup && (
                                                    <span className="text-xs flex-shrink-0" style={{ color: isActive ? "rgba(255,255,255,0.6)" : "#94a3b8" }}>
                                                        {conv.memberCount} members ·
                                                    </span>
                                                )}
                                                <p
                                                    className={`truncate text-xs mt-0.5 ${!isActive && conv.unreadCount > 0 ? "font-semibold" : ""}`}
                                                    style={{ color: isActive ? "rgba(255,255,255,0.8)" : (conv.unreadCount > 0 ? "#1E252B" : "#64748B") }}
                                                >
                                                    {conv.lastMessageBody ?? "No messages yet"}
                                                </p>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                )}
            </div>

            {/* Group Creation Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.4)" }}>
                    <div
                        className="w-full max-w-md mx-4 rounded-2xl shadow-2xl p-6 animate-fade-in"
                        style={{ background: "rgba(255,255,255,0.95)", backdropFilter: "blur(20px)" }}
                    >
                        <div className="flex items-center justify-between mb-5">
                            <h3 className="text-lg font-bold" style={{ color: "#1E252B" }}>Create Group</h3>
                            <button
                                onClick={() => { setShowGroupModal(false); setGroupName(""); setSelectedMembers([]); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                                style={{ color: "#94a3b8" }}
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {/* Group name input */}
                        <input
                            type="text"
                            placeholder="Group name..."
                            value={groupName}
                            onChange={(e) => setGroupName(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-sky-400"
                            style={{ color: "#1E252B" }}
                        />

                        {/* Selected members tags */}
                        {selectedMembers.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-3">
                                {selectedMembers.map((id) => {
                                    const u = users.find((u) => u._id === id);
                                    return (
                                        <span
                                            key={id}
                                            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
                                            style={{ background: "rgba(60,145,197,0.15)", color: "#3C91C5" }}
                                        >
                                            {u?.name ?? "Unknown"}
                                            <button
                                                onClick={() => toggleMember(id)}
                                                className="hover:text-red-500 transition-colors ml-0.5"
                                            >
                                                ×
                                            </button>
                                        </span>
                                    );
                                })}
                            </div>
                        )}

                        {/* User list for member selection */}
                        <p className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: "#64748B" }}>
                            Select Members
                        </p>
                        <div className="max-h-48 overflow-y-auto space-y-1 mb-5 custom-scrollbar">
                            {users.map((user) => {
                                const isSelected = selectedMembers.includes(user._id);
                                return (
                                    <button
                                        key={user._id}
                                        onClick={() => toggleMember(user._id)}
                                        className={`flex w-full items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 ${isSelected ? "ring-2" : ""}`}
                                        style={{
                                            background: isSelected ? "rgba(60,145,197,0.08)" : "rgba(255,255,255,0.5)",
                                            ...(isSelected ? { ringColor: "#3C91C5" } : {}),
                                        }}
                                    >
                                        <div className="relative flex-shrink-0">
                                            {user.imageUrl ? (
                                                <img src={user.imageUrl} alt={user.name} className="h-8 w-8 rounded-full object-cover ring-1 ring-white" />
                                            ) : (
                                                <div className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold text-white" style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}>
                                                    {user.name.charAt(0).toUpperCase()}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm font-medium flex-1" style={{ color: "#1E252B" }}>{user.name}</p>
                                        {isSelected && (
                                            <svg className="w-5 h-5 flex-shrink-0" style={{ color: "#3C91C5" }} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                            </svg>
                                        )}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Create button */}
                        <button
                            onClick={handleCreateGroup}
                            disabled={!groupName.trim() || selectedMembers.length === 0}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-40 disabled:hover:translate-y-0"
                            style={{ background: "linear-gradient(135deg, #3C91C5 0%, #5A7D95 100%)" }}
                        >
                            Create Group ({selectedMembers.length} member{selectedMembers.length !== 1 ? "s" : ""})
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

