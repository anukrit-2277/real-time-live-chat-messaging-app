"use client";

import { useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

// Sends a heartbeat to the server every 30 seconds to mark the user as online.
// Also sends one immediately on mount and clears on unmount.
export function useHeartbeat(tokenIdentifier: string | undefined) {
    const heartbeat = useMutation(api.users.heartbeat);

    useEffect(() => {
        if (!tokenIdentifier) return;

        // Send heartbeat immediately
        heartbeat({ tokenIdentifier });

        // Then every 30 seconds
        const interval = setInterval(() => {
            heartbeat({ tokenIdentifier });
        }, 30000);

        return () => clearInterval(interval);
    }, [tokenIdentifier, heartbeat]);
}
