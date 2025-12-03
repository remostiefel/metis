import type { Config } from "tailwindcss";

export default {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--background)",
                foreground: "var(--foreground)",
                primary: {
                    DEFAULT: "#0D9488", // Deep Teal
                    foreground: "#FFFFFF",
                },
                secondary: {
                    DEFAULT: "#F59E0B", // Warm Amber
                    foreground: "#FFFFFF",
                },
                neutral: {
                    DEFAULT: "#64748B", // Cool Gray
                    foreground: "#FFFFFF",
                },
                success: {
                    DEFAULT: "#10B981", // Sage Green
                    foreground: "#FFFFFF",
                },
                paper: "#F8FAFC",
            },
        },
    },
    plugins: [],
} satisfies Config;
