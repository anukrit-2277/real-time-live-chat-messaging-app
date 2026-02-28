"use client";

import { SignIn, SignUp } from "@clerk/nextjs";
import { useState, useEffect } from "react";

export default function AuthPage() {
    const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
    const [isLoaded, setIsLoaded] = useState(false);

    // Show the full page only once Clerk has had time to render
    useEffect(() => {
        const timer = setTimeout(() => setIsLoaded(true), 800);
        return () => clearTimeout(timer);
    }, []);

    // Clerk appearance: remove default card chrome so it fits inside our container
    const clerkAppearance = {
        elements: {
            rootBox: "w-full",
            cardBox: "w-full shadow-none",
            card: "bg-transparent shadow-none w-full p-0 m-0 gap-4",
            headerTitle: "text-slate-800 font-semibold text-lg",
            headerSubtitle: "text-slate-500 text-sm",
            formButtonPrimary:
                "font-semibold text-white shadow-md hover:shadow-lg transition-all duration-200 rounded-lg",
            socialButtonsBlockButton: "hidden",
            socialButtonsBlockButtonText: "hidden",
            socialButtonsProviderIcon: "hidden",
            dividerRow: "hidden",
            formFieldLabel: "text-slate-600 text-sm font-medium",
            formFieldInput:
                "bg-white/80 border-slate-200 text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:ring-2 focus:ring-sky-200 rounded-lg shadow-sm",
            footerActionLink:
                "text-sky-600 hover:text-sky-500 transition-colors duration-200 font-medium",
            footerActionText: "text-slate-500",
            formFieldAction: "text-sky-600 hover:text-sky-500 text-sm",
            footer: "bg-transparent pt-2",
            identityPreviewEditButton: "text-sky-600 hover:text-sky-500",
            identityPreviewText: "text-slate-700",
            alert: "bg-red-50 border-red-200 text-red-700 rounded-lg",
            otpCodeFieldInput:
                "bg-white/80 border-slate-200 text-slate-800 rounded-lg",
        },
        layout: {
            showOptionalFields: false,
        },
    };

    // Loading state
    if (!isLoaded) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center animate-fade-in">
                    <img
                        src="/tarschat-logo.png"
                        alt="TarsChat"
                        className="h-16 mx-auto mb-5 drop-shadow-lg"
                        style={{ mixBlendMode: "multiply" }}
                    />
                    <div className="flex space-x-1.5 justify-center mb-4">
                        <div
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ background: "#3C91C5" }}
                        />
                        <div
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ background: "#5A7D95", animationDelay: "0.15s" }}
                        />
                        <div
                            className="w-2 h-2 rounded-full animate-bounce"
                            style={{ background: "#77A3B8", animationDelay: "0.3s" }}
                        />
                    </div>
                    <p className="text-sm font-medium" style={{ color: "#64748b" }}>
                        Loading TarsChat...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col relative overflow-hidden">
            {/* Floating decorative circles */}
            <div
                className="floating-circle w-48 h-48 top-10 left-10 opacity-15 hidden sm:block animate-float"
                style={{ background: "linear-gradient(135deg, #3C91C5, #5A7D95)" }}
            />
            <div
                className="floating-circle w-32 h-32 top-48 right-16 opacity-10 hidden sm:block animate-float"
                style={{
                    background: "linear-gradient(135deg, #5A7D95, #3C91C5)",
                    animationDelay: "1.5s",
                }}
            />
            <div
                className="floating-circle w-28 h-28 bottom-20 left-1/3 opacity-15 hidden sm:block animate-float"
                style={{
                    background: "linear-gradient(135deg, #5A7D95, #77A3B8)",
                    animationDelay: "0.8s",
                }}
            />

            {/* Top nav */}
            <nav
                className="relative z-10 flex items-center justify-between px-5 sm:px-8 h-14 animate-fade-in"
                style={{
                    background: "rgba(255, 255, 255, 0.72)",
                    backdropFilter: "saturate(180%) blur(20px)",
                    WebkitBackdropFilter: "saturate(180%) blur(20px)",
                    borderBottom: "1px solid rgba(0, 0, 0, 0.06)",
                }}
            >
                <a href="/" className="flex items-center gap-2.5 group">
                    <img
                        src="/tarschat-logo.png"
                        alt="TarsChat"
                        className="h-8 transition-transform duration-200 ease-out group-hover:scale-[1.03]"
                        style={{ mixBlendMode: "multiply" }}
                    />
                    <span
                        className="text-[15px] font-semibold tracking-tight"
                        style={{ color: "#0f172a" }}
                    >
                        TarsChat
                    </span>
                </a>
                <a
                    href="/"
                    className="text-[13px] font-medium transition-colors duration-200 hover:opacity-70"
                    style={{ color: "#64748b" }}
                >
                    Back to home
                </a>
            </nav>

            {/* Main content */}
            <div className="flex-1 flex items-center justify-center relative z-10 px-4 py-6 animate-fade-in">
                <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-16 max-w-5xl w-full">
                    {/* Left: Branding panel (desktop only) */}
                    <div className="hidden lg:flex flex-col flex-1 max-w-md">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <p
                                    className="text-[11px] font-semibold tracking-[0.15em] uppercase"
                                    style={{ color: "#3C91C5" }}
                                >
                                    Real-time Messaging Platform
                                </p>
                                <h1
                                    className="text-[40px] leading-[1.1] font-bold tracking-tight"
                                    style={{ color: "#1E252B" }}
                                >
                                    Secure.
                                    <br />
                                    Real-time.
                                    <br />
                                    <span style={{ color: "#94a3b8" }}>Conversations.</span>
                                </h1>
                            </div>
                            <p
                                className="text-[15px] leading-relaxed max-w-sm"
                                style={{ color: "#64748b" }}
                            >
                                Experience messaging that feels instant. Beautifully crafted and
                                built for the modern web.
                            </p>
                            <div className="flex items-center gap-3 pt-2">
                                {["Next.js", "Convex", "Clerk"].map((tech) => (
                                    <span
                                        key={tech}
                                        className="text-[11px] font-medium px-3 py-1.5 rounded-full"
                                        style={{
                                            color: "#64748b",
                                            border: "1px solid rgba(0, 0, 0, 0.08)",
                                            background: "rgba(255, 255, 255, 0.5)",
                                        }}
                                    >
                                        {tech}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right: Auth card */}
                    <div className="w-full max-w-[420px]">
                        {/* Mobile heading */}
                        <div className="lg:hidden text-center mb-6">
                            <img
                                src="/tarschat-logo.png"
                                alt="TarsChat"
                                className="h-12 mx-auto mb-3 drop-shadow-md"
                                style={{ mixBlendMode: "multiply" }}
                            />
                            <h1 className="text-xl font-bold tracking-tight gradient-text">
                                Welcome to TarsChat
                            </h1>
                            <p className="text-sm mt-1" style={{ color: "#64748b" }}>
                                Secure. Real-time. Conversations.
                            </p>
                        </div>

                        {/* Auth card container */}
                        <div
                            className="rounded-2xl px-5 sm:px-7 py-6"
                            style={{
                                background: "rgba(255, 255, 255, 0.65)",
                                border: "1px solid rgba(255, 255, 255, 0.5)",
                                boxShadow:
                                    "0 8px 32px rgba(0, 0, 0, 0.08), 0 2px 8px rgba(0, 0, 0, 0.04)",
                                backdropFilter: "blur(20px)",
                            }}
                        >
                            {/* Toggle tabs */}
                            <div
                                className="flex rounded-xl p-1 mb-5"
                                style={{
                                    background: "rgba(0, 0, 0, 0.04)",
                                    border: "1px solid rgba(0, 0, 0, 0.06)",
                                }}
                            >
                                <button
                                    onClick={() => setMode("sign-in")}
                                    className="flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200"
                                    style={
                                        mode === "sign-in"
                                            ? {
                                                background: "rgba(255, 255, 255, 0.85)",
                                                color: "#1E252B",
                                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                                            }
                                            : { color: "#94a3b8" }
                                    }
                                >
                                    Sign In
                                </button>
                                <button
                                    onClick={() => setMode("sign-up")}
                                    className="flex-1 py-2 text-[13px] font-semibold rounded-lg transition-all duration-200"
                                    style={
                                        mode === "sign-up"
                                            ? {
                                                background: "rgba(255, 255, 255, 0.85)",
                                                color: "#1E252B",
                                                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.08)",
                                            }
                                            : { color: "#94a3b8" }
                                    }
                                >
                                    Sign Up
                                </button>
                            </div>

                            {/* Clerk component -- card chrome removed via appearance */}
                            {mode === "sign-in" ? (
                                <SignIn
                                    appearance={clerkAppearance}
                                    routing="hash"
                                    afterSignInUrl="/"
                                />
                            ) : (
                                <SignUp
                                    appearance={clerkAppearance}
                                    routing="hash"
                                    afterSignUpUrl="/"
                                />
                            )}
                        </div>

                        {/* Privacy note */}
                        <p
                            className="text-center mt-4 text-[11px] font-medium"
                            style={{ color: "#94a3b8" }}
                        >
                            By continuing, you agree to TarsChat&apos;s Terms and Privacy
                            Policy.
                        </p>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer
                className="relative z-10 flex items-center justify-center px-6 h-10"
                style={{ borderTop: "1px solid rgba(0, 0, 0, 0.05)" }}
            >
                <p className="text-[11px] font-medium" style={{ color: "#94a3b8" }}>
                    &copy; {new Date().getFullYear()} TarsChat. All rights reserved.
                </p>
            </footer>
        </div>
    );
}
