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

    // Filter users by search term
    const filteredUsers = search
        ? users.filter((u) =>
            u.name.toLowerCase().includes(search.toLowerCase())
        )
        : [];

    const handleUserClick = async (userId: Id<"users">) => {
        const conversationId = await createOrGet({
            currentUserTokenIdentifier,
            otherUserId: userId,
        });
        setSearch("");
        onSelectConversation(conversationId);
    };

    return (
        <div className="flex h-full w-80 flex-col border-r bg-gray-50">
            {/* Search bar */}
            <div className="p-3">
                <input
                    type="text"
                    placeholder="Search users..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none"
                />
            </div>

            <div className="flex-1 overflow-y-auto">
                {/* Search results (only shown when typing) */}
                {search && (
                    <div>
                        <p className="px-3 py-1 text-xs font-medium uppercase text-gray-400">
                            Users
                        </p>
                        {filteredUsers.length === 0 ? (
                            <p className="p-3 text-center text-sm text-gray-400">
                                No users found
                            </p>
                        ) : (
                            filteredUsers.map((user) => (
                                <button
                                    key={user._id}
                                    onClick={() => handleUserClick(user._id)}
                                    className="flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-gray-100"
                                >
                                    {user.imageUrl ? (
                                        <img
                                            src={user.imageUrl}
                                            alt={user.name}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                                            {user.name.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}

                {/* Conversation list (shown when not searching) */}
                {!search && (
                    <div>
                        <p className="px-3 py-1 text-xs font-medium uppercase text-gray-400">
                            Conversations
                        </p>
                        {conversations.length === 0 ? (
                            <div className="p-4 text-center">
                                <p className="text-sm text-gray-400">
                                    No conversations yet.
                                </p>
                                <p className="mt-1 text-xs text-gray-400">
                                    Search for a user to start chatting.
                                </p>
                            </div>
                        ) : (
                            conversations.map((conv) => (
                                <button
                                    key={conv._id}
                                    onClick={() => onSelectConversation(conv._id)}
                                    className={`flex w-full items-center gap-3 px-3 py-3 text-left hover:bg-gray-100 ${selectedConversationId === conv._id
                                            ? "bg-gray-200"
                                            : ""
                                        }`}
                                >
                                    {conv.otherUserImage ? (
                                        <img
                                            src={conv.otherUserImage}
                                            alt={conv.otherUserName}
                                            className="h-10 w-10 rounded-full object-cover"
                                        />
                                    ) : (
                                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500 text-sm font-medium text-white">
                                            {conv.otherUserName.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-medium text-gray-900">
                                                {conv.otherUserName}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                {formatTimestamp(conv.lastMessageTime)}
                                            </p>
                                        </div>
                                        <p className="truncate text-xs text-gray-500">
                                            {conv.lastMessageBody ?? "No messages yet"}
                                        </p>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
