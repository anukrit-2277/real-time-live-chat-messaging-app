import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Marks a conversation as read by setting lastReadTime to now.
export const markRead = mutation({
    args: {
        conversationId: v.id("conversations"),
        tokenIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (!user) return;

        const existing = await ctx.db
            .query("readStatus")
            .withIndex("by_conversation_user", (q) =>
                q
                    .eq("conversationId", args.conversationId)
                    .eq("userId", user._id)
            )
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                lastReadTime: Date.now(),
            });
        } else {
            await ctx.db.insert("readStatus", {
                conversationId: args.conversationId,
                userId: user._id,
                lastReadTime: Date.now(),
            });
        }
    },
});

// Returns the unread count for a specific conversation/user pair.
export const getUnreadCount = query({
    args: {
        conversationId: v.id("conversations"),
        tokenIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (!user) return 0;

        const readEntry = await ctx.db
            .query("readStatus")
            .withIndex("by_conversation_user", (q) =>
                q
                    .eq("conversationId", args.conversationId)
                    .eq("userId", user._id)
            )
            .unique();

        const lastReadTime = readEntry?.lastReadTime ?? 0;

        // Count messages after lastReadTime that were NOT sent by the current user
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .collect();

        const unread = messages.filter(
            (m) => m._creationTime > lastReadTime && m.senderId !== user._id
        );

        return unread.length;
    },
});
