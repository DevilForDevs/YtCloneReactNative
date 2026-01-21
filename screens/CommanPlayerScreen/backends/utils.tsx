import { decode as atob } from "base-64"; // install: npm install base-64

export function decodeLParam(url: string): string | null {
    try {
        // 1️⃣ extract 'l' parameter manually
        const query = url.split("?")[1] || "";
        const params = query.split("&").map(p => p.split("="));
        const lParam = params.find(([key]) => key === "l")?.[1];
        if (!lParam) return null;

        // 2️⃣ fix URL-safe base64 & padding
        let raw = decodeURIComponent(lParam).replace(/-/g, "+").replace(/_/g, "/");
        raw += "=".repeat((4 - (raw.length % 4)) % 4);

        // 3️⃣ decode base64 to binary string
        const decodedStr = atob(raw);

        // 4️⃣ extract URL using regex
        const match = decodedStr.match(/https?:\/\/[^\x00-\x20"']+/);
        return match ? match[0] : null;
    } catch (err) {
        console.error("Error decoding URL:", err);
        return null;
    }
}
