import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

// Called from the client when a user logs in.
// Stores or updates the user record in the database.
export const store = mutation({
    args: {
        name: v.string(),
        email: v.string(),
        imageUrl: v.string(),
        tokenIdentifier: v.string(),
    },
    handler: async (ctx, args) => {
        // Check if the user already exists
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (user !== null) {
            // Update name/email/image if they changed
            if (
                user.name !== args.name ||
                user.email !== args.email ||
                user.imageUrl !== args.imageUrl
            ) {
                await ctx.db.patch(user._id, {
                    name: args.name,
                    email: args.email,
                    imageUrl: args.imageUrl,
                });
            }
            return user._id;
        }

        // Create a new user record
        return await ctx.db.insert("users", {
            name: args.name,
            email: args.email,
            imageUrl: args.imageUrl,
            tokenIdentifier: args.tokenIdentifier,
            lastSeen: Date.now(),
        });
    },
});

// Returns all users.
export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});

// Returns all users except the one with the given tokenIdentifier.
// Includes isOnline status based on lastSeen within the last 60 seconds.
export const getExcludingMe = query({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        const allUsers = await ctx.db.query("users").collect();
        const now = Date.now();
        return allUsers
            .filter((u) => u.tokenIdentifier !== args.tokenIdentifier)
            .map((u) => ({
                ...u,
                isOnline: u.lastSeen ? now - u.lastSeen < 60000 : false,
            }));
    },
});

// Returns the current user's document.
export const getCurrentUser = query({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        return await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();
    },
});

// Heartbeat: updates the user's lastSeen timestamp.
// Called every 30 seconds from the client.
export const heartbeat = mutation({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", args.tokenIdentifier)
            )
            .unique();

        if (user) {
            await ctx.db.patch(user._id, { lastSeen: Date.now() });
        }
    },
});
