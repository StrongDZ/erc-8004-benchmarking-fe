import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
        "./features/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./shared/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            colors: {
                background: "var(--color-bg)",
                card: "var(--color-bg-card)",
                elevated: "var(--color-bg-elevated)",
                text: "var(--color-text)",
                muted: "var(--color-text-muted)",
                subtle: "var(--color-text-subtle)",
                primary: "var(--color-primary)",
                primaryHover: "var(--color-primary-hover)",
                accent: "var(--color-accent)",
                success: "var(--color-success)",
                danger: "var(--color-danger)",
                warning: "var(--color-warning)",
                warningDim: "var(--color-warning-dim)",
                border: "var(--color-border)",
            },
            fontFamily: {
                heading: ["var(--font-heading)", "monospace"],
                body: ["var(--font-body)", "sans-serif"],
            },
            fontSize: {
                // Sub-`xs` micro scale (font-size only → exact swap-in for arbitrary text-[Npx])
                "2xs": "11px",
                "3xs": "10px",
            },
        },
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
