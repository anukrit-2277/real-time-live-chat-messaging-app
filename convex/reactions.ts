import { v } from "convex/values";
import { mutation } from "./_generated/server";

const ALLOWED_EMOJIS = ["👍", "❤️", "😂", "😮", "😢"];

// Toggle a reaction: if the user already reacted with this emoji, remove it; otherwise add it.
export const toggle = mutation({
    args: {
        messageId: v.id("messages"),
        tokenIdentifier: v.string(),
        emoji: v.string(),
    },
    handler: async (ctx, args) => {
        if (!ALLOWED_EMOJIS.includes(args.emoji)) {
            throw new Error("Invalid emoji reaction");
        }

        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (!user) throw new Error("User not found");

        // Check if user already reacted with this emoji
        const existing = await ctx.db
            .query("reactions")
            .withIndex("by_message_user", (q) =>
                q.eq("messageId", args.messageId).eq("userId", user._id)
            )
            .collect();

        const sameEmoji = existing.find((r) => r.emoji === args.emoji);

        if (sameEmoji) {
            // Toggle off — remove the reaction
            await ctx.db.delete(sameEmoji._id);
        } else {
            // Add the reaction
            await ctx.db.insert("reactions", {
                messageId: args.messageId,
                userId: user._id,
                emoji: args.emoji,
            });
        }
    },
});
