import { mutation, query } from "./_generated/server";

// Called from the client when a user logs in.
// Upserts the user record in the database.
export const store = mutation({
    args: {},
    handler: async (ctx) => {
        const identity = await ctx.auth.getUserIdentity();
        if (!identity) {
            throw new Error("Called storeUser without authentication present");
        }

        // Check if the user already exists
        const user = await ctx.db
            .query("users")
            .withIndex("by_token", (q) =>
                q.eq("tokenIdentifier", identity.tokenIdentifier)
            )
            .unique();

        if (user !== null) {
            // Update name/email/image if they changed
            if (
                user.name !== identity.name ||
                user.email !== identity.email ||
                user.imageUrl !== identity.pictureUrl
            ) {
                await ctx.db.patch(user._id, {
                    name: identity.name ?? "Anonymous",
                    email: identity.email ?? "",
                    imageUrl: identity.pictureUrl ?? "",
                });
            }
            return user._id;
        }

        // Create a new user record
        return await ctx.db.insert("users", {
            name: identity.name ?? "Anonymous",
            email: identity.email ?? "",
            imageUrl: identity.pictureUrl ?? "",
            tokenIdentifier: identity.tokenIdentifier,
        });
    },
});

// Returns all users so other users can discover them.
export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("users").collect();
    },
});
