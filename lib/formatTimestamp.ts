// Formats a timestamp based on how old it is:
// - Today: "2:34 PM"
// - This year: "Feb 15, 2:34 PM"
// - Different year: "Feb 15, 2025, 2:34 PM"
export function formatTimestamp(timestamp: number): string {
    const date = new Date(timestamp);
    const now = new Date();

    const isToday =
        date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    const isSameYear = date.getFullYear() === now.getFullYear();

    const timeStr = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });

    if (isToday) {
        return timeStr;
    }

    const monthDay = date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
    });

    if (isSameYear) {
        return `${monthDay}, ${timeStr}`;
    }

    return `${monthDay}, ${date.getFullYear()}, ${timeStr}`;
}
