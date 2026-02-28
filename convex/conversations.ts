import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Creates a new conversation or returns an existing one between two users.
export const createOrGet = mutation({
    args: {
        currentUserTokenIdentifier: v.string(),
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Find the current user in the database
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.currentUserTokenIdentifier)
            )
            .unique();

        if (!currentUser) {
            throw new Error("Current user not found in database");
        }

        // Check if a conversation already exists between these two users
        const allConversations = await ctx.db.query("conversations").collect();

        const existing = allConversations.find((conv) => {
            const p = conv.participants;
            return (
                p.length === 2 &&
                p.includes(currentUser._id) &&
                p.includes(args.otherUserId)
            );
        });

        if (existing) {
            return existing._id;
        }

        // Create a new conversation
        const conversationId = await ctx.db.insert("conversations", {
            participants: [currentUser._id, args.otherUserId],
        });

        return conversationId;
    },
});

// Creates a new group conversation with multiple members.
export const createGroup = mutation({
    args: {
        currentUserTokenIdentifier: v.string(),
        name: v.string(),
        memberIds: v.array(v.id("users")),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.currentUserTokenIdentifier)
            )
            .unique();

        if (!currentUser) {
            throw new Error("Current user not found in database");
        }

        if (args.memberIds.length < 1) {
            throw new Error("Group must have at least one other member");
        }

        if (!args.name.trim()) {
            throw new Error("Group name is required");
        }

        // Include the creator in the participants
        const participants = [currentUser._id, ...args.memberIds];

        const conversationId = await ctx.db.insert("conversations", {
            participants,
            name: args.name.trim(),
            isGroup: true,
        });

        return conversationId;
    },
});

// Returns all conversations the current user is part of,
// with participant info and the last message preview.
export const list = query({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (!currentUser) {
            return [];
        }

        const allConversations = await ctx.db.query("conversations").collect();

        const myConversations = allConversations.filter((conv) =>
            conv.participants.includes(currentUser._id)
        );

        // For each conversation, get participant info and last message
        const conversationsWithDetails = await Promise.all(
            myConversations.map(async (conv) => {
                // Get the last message in this conversation
                const messages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) =>
                        q.eq("conversationId", conv._id)
                    )
                    .order("desc")
                    .take(1);

                const lastMessage = messages[0] ?? null;

                // Compute unread count
                const readEntry = await ctx.db
                    .query("readStatus")
                    .withIndex("by_conversation_user", (q) =>
                        q
                            .eq("conversationId", conv._id)
                            .eq("userId", currentUser._id)
                    )
                    .unique();

                const lastReadTime = readEntry?.lastReadTime ?? 0;
                const allMessages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) =>
                        q.eq("conversationId", conv._id)
                    )
                    .collect();
                const unreadCount = allMessages.filter(
                    (m) => m._creationTime > lastReadTime && m.senderId !== currentUser._id
                ).length;

                const now = Date.now();

                // ----- Group conversation -----
                if (conv.isGroup) {
                    // Get info for all members
                    const memberInfos = await Promise.all(
                        conv.participants.map(async (pid) => {
                            const u = await ctx.db.get(pid);
                            return u
                                ? {
                                    _id: u._id,
                                    name: u.name,
                                    imageUrl: u.imageUrl,
                                    isOnline: u.lastSeen ? now - u.lastSeen < 60000 : false,
                                }
                                : null;
                        })
                    );

                    const validMembers = memberInfos.filter((m) => m !== null);

                    return {
                        _id: conv._id,
                        isGroup: true as const,
                        groupName: conv.name ?? "Group",
                        memberCount: validMembers.length,
                        memberImages: validMembers.slice(0, 3).map((m) => m.imageUrl),
                        membersOnline: validMembers.filter((m) => m.isOnline).length,
                        members: validMembers.map((m) => ({
                            name: m.name,
                            imageUrl: m.imageUrl,
                            isOnline: m.isOnline,
                        })),
                        // For the sidebar these aren't used, but we keep them
                        // null so the type is consistent
                        otherUserName: conv.name ?? "Group",
                        otherUserImage: null as string | null,
                        otherUserIsOnline: false,
                        otherUserLastSeen: null as number | null,
                        lastMessageBody: lastMessage?.deleted
                            ? "This message was deleted"
                            : (lastMessage?.body ?? null),
                        lastMessageTime:
                            lastMessage?._creationTime ?? conv._creationTime,
                        unreadCount,
                    };
                }

                // ----- DM conversation -----
                const otherUserId = conv.participants.find(
                    (id) => id !== currentUser._id
                );
                const otherUser = otherUserId
                    ? await ctx.db.get(otherUserId)
                    : null;

                // Skip conversations where the other user was deleted
                if (!otherUser) {
                    return null;
                }

                return {
                    _id: conv._id,
                    isGroup: false as const,
                    groupName: null as string | null,
                    memberCount: 2,
                    memberImages: null as string[] | null,
                    membersOnline: 0,
                    members: null as { name: string; imageUrl: string; isOnline: boolean }[] | null,
                    otherUserName: otherUser.name,
                    otherUserImage: otherUser.imageUrl,
                    otherUserIsOnline: otherUser.lastSeen ? now - otherUser.lastSeen < 60000 : false,
                    otherUserLastSeen: otherUser.lastSeen ?? null,
                    lastMessageBody: lastMessage?.deleted ? "This message was deleted" : (lastMessage?.body ?? null),
                    lastMessageTime: lastMessage?._creationTime ?? conv._creationTime,
                    unreadCount,
                };
            })
        );

        // Filter out null entries (deleted users) and sort by most recent
        const validConversations = conversationsWithDetails.filter(
            (c) => c !== null
        );

        validConversations.sort(
            (a, b) => b.lastMessageTime - a.lastMessageTime
        );

        return validConversations;
    },
});
