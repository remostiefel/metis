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
                background: "#FDFBF7", // Warm Off-White / Cream
                foreground: "#334155", // Slate 700
                primary: {
                    DEFAULT: "#5EEAD4", // Soft Teal
                    foreground: "#0F172A", // Slate 900
                },
                secondary: {
                    DEFAULT: "#FDBA74", // Soft Orange/Peach
                    foreground: "#0F172A", // Slate 900
                },
                accent: {
                    DEFAULT: "#C4B5FD", // Soft Violet
                    foreground: "#0F172A",
                },
                neutral: {
                    DEFAULT: "#94A3B8", // Slate 400
                    foreground: "#FFFFFF",
                },
                success: {
                    DEFAULT: "#6EE7B7", // Soft Green
                    foreground: "#064E3B",
                },
                paper: "#FFFFFF",
            },
        },
    },
    plugins: [],
} satisfies Config;
