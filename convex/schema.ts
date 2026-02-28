import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        tokenIdentifier: v.string(),
        lastSeen: v.optional(v.number()),
    }).index("by_token", ["tokenIdentifier"]),

    conversations: defineTable({
        participants: v.array(v.id("users")),
        name: v.optional(v.string()),
        isGroup: v.optional(v.boolean()),
    }),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        body: v.string(),
        deleted: v.optional(v.boolean()),
    }).index("by_conversation", ["conversationId"]),

    // Tracks who is currently typing in which conversation
    typingStatus: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        isTyping: v.boolean(),
        lastTypedAt: v.number(),
    })
        .index("by_conversation", ["conversationId"])
        .index("by_conversation_user", ["conversationId", "userId"]),

    // Tracks when a user last read a conversation (for unread counts)
    readStatus: defineTable({
        conversationId: v.id("conversations"),
        userId: v.id("users"),
        lastReadTime: v.number(),
    })
        .index("by_conversation_user", ["conversationId", "userId"]),

    // Tracks emoji reactions on messages
    reactions: defineTable({
        messageId: v.id("messages"),
        userId: v.id("users"),
        emoji: v.string(),
    })
        .index("by_message", ["messageId"])
        .index("by_message_user", ["messageId", "userId"]),
});
