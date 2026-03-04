import type { Config } from "tailwindcss";

const config: Config = {
    content: [
        "./pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./components/**/*.{js,ts,jsx,tsx,mdx}",
        "./app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                arabic: ['Cairo', 'sans-serif'],
            },
            colors: {
                primary: "#0f172a",
                secondary: "#1e293b",
                accent: "#38bdf8",
            },
        },
    },
    plugins: [],
};
export default config;
