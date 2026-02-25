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

// Returns all conversations the current user is part of,
// with the other participant's info and the last message preview.
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

        // For each conversation, get the other user's info and the last message
        const conversationsWithDetails = await Promise.all(
            myConversations.map(async (conv) => {
                // Find the other participant
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

                // Get the last message in this conversation
                const messages = await ctx.db
                    .query("messages")
                    .withIndex("by_conversation", (q) =>
                        q.eq("conversationId", conv._id)
                    )
                    .order("desc")
                    .take(1);

                const lastMessage = messages[0] ?? null;

                return {
                    _id: conv._id,
                    otherUserName: otherUser.name,
                    otherUserImage: otherUser.imageUrl,
                    lastMessageBody: lastMessage?.body ?? null,
                    lastMessageTime: lastMessage?._creationTime ?? conv._creationTime,
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
