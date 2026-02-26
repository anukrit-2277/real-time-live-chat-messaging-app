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
    }),

    messages: defineTable({
        conversationId: v.id("conversations"),
        senderId: v.id("users"),
        body: v.string(),
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
});
