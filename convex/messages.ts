import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Send a message in a conversation.
export const send = mutation({
    args: {
        conversationId: v.id("conversations"),
        senderTokenIdentifier: v.string(),
        body: v.string(),
    },
    handler: async (ctx, args) => {
        // Find the sender in the database
        const sender = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.senderTokenIdentifier)
            )
            .unique();

        if (!sender) {
            throw new Error("Sender not found in database");
        }

        await ctx.db.insert("messages", {
            conversationId: args.conversationId,
            senderId: sender._id,
            body: args.body,
        });
    },
});

// List all messages in a conversation, ordered by creation time.
// Convex subscriptions make this real-time automatically.
export const list = query({
    args: { conversationId: v.id("conversations") },
    handler: async (ctx, args) => {
        const messages = await ctx.db
            .query("messages")
            .withIndex("by_conversation", (q) =>
                q.eq("conversationId", args.conversationId)
            )
            .order("asc")
            .collect();

        // Attach sender info to each message
        const messagesWithSender = await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);
                return {
                    ...msg,
                    senderName: sender?.name ?? "Unknown",
                    senderImage: sender?.imageUrl ?? "",
                };
            })
        );

        return messagesWithSender;
    },
});
