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

// Returns all conversations the current user is part of.
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

        return allConversations.filter((conv) =>
            conv.participants.includes(currentUser._id)
        );
    },
});
