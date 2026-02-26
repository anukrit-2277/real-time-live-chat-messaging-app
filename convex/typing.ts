import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Sets or updates the typing status for a user in a conversation.
export const setTyping = mutation({
    args: {
        conversationId: v.id("conversations"),
        tokenIdentifier: v.string(),
        isTyping: v.boolean(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (!user) return;

        // Check if a typing status entry already exists
        const existing = await ctx.db
            .query("typingStatus")
            .withIndex("by_conversation_user", (q) =>
                q
                    .eq("conversationId", args.conversationId)
                    .eq("userId", user._id)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                isTyping: args.isTyping,
                lastTypedAt: Date.now(),
            });
        } else if (args.isTyping) {
            await ctx.db.insert("typingStatus", {
                conversationId: args.conversationId,
                userId: user._id,
                isTyping: true,
                lastTypedAt: Date.now(),
            });
        }
    },
});

// Returns who is typing in a conversation (excluding the current user).
// A user is considered typing if isTyping=true and lastTypedAt < 3 seconds ago.
export const getTyping = query({
    args: {
        conversationId: v.id("conversations"),
        tokenIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUser = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (!currentUser) return [];

        const typingEntries = await ctx.db
            .query("typingStatus")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        const now = Date.now();

        // Filter for other users who are actively typing (within last 3 seconds)
        const activeTypers = [];
        for (const entry of typingEntries) {
            if (
                entry.userId !== currentUser._id &&
                entry.isTyping &&
                now - entry.lastTypedAt < 3000
            ) {
                const user = await ctx.db.get(entry.userId);
                if (user) {
                    activeTypers.push({
                        userId: entry.userId,
                        userName: user.name,
                    });
                }
            }
        }

        return activeTypers;
    },
});
