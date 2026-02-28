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

// Soft-delete a message (only the sender can delete their own messages).
export const deleteMessage = mutation({
    args: {
        messageId: v.id("messages"),
        tokenIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (!user) throw new Error("User not found");

        const message = await ctx.db.get(args.messageId);
        if (!message) throw new Error("Message not found");
        if (message.senderId !== user._id) {
            throw new Error("You can only delete your own messages");
        }

        await ctx.db.patch(args.messageId, { deleted: true });
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

        // Attach sender info and reactions to each message
        const messagesWithSender = await Promise.all(
            messages.map(async (msg) => {
                const sender = await ctx.db.get(msg.senderId);

                // Fetch reactions for this message
                const reactions = await ctx.db
                    .query("reactions")
                    .withIndex("by_message", (q) =>
                        q.eq("messageId", msg._id)
                    )
                    .collect();

                // Group reactions by emoji into an array (Convex doesn't allow non-ASCII object keys)
                // For deleted messages, return empty reactions
                const reactionCounts: { emoji: string; count: number; userIds: string[] }[] = [];
                if (!msg.deleted) {
                    for (const r of reactions) {
                        const existing = reactionCounts.find((rc) => rc.emoji === r.emoji);
                        if (existing) {
                            existing.count++;
                            existing.userIds.push(r.userId);
                        } else {
                            reactionCounts.push({ emoji: r.emoji, count: 1, userIds: [r.userId] });
                        }
                    }
                }

                return {
                    ...msg,
                    senderName: sender?.name ?? "Unknown",
                    senderImage: sender?.imageUrl ?? "",
                    body: msg.deleted ? "This message was deleted" : msg.body,
                    deleted: msg.deleted ?? false,
                    reactions: reactionCounts,
                };
            })
        );

        return messagesWithSender;
    },
});
