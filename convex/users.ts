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
export const getExcludingMe = query({
    args: { tokenIdentifier: v.string() },
    handler: async (ctx, args) => {
        const allUsers = await ctx.db.query("users").collect();
        return allUsers.filter(
            (u) => u.tokenIdentifier !== args.tokenIdentifier
        );
    },
});
