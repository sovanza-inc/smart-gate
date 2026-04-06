import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0d1117",
        bg2: "#1c2128",
        bg3: "#161b22",
        border: "#30363d",
        border2: "#21262d",
        text: "#e6edf3",
        text2: "#8b949e",
        accent: "#1f6feb",
        green: "#238636",
        green2: "#3fb950",
        red: "#b91c1c",
        red2: "#f85149",
        orange: "#9a6700",
        yellow: "#f0b429",
        cyan: "#00d4ff",
      },
    },
  },
  plugins: [],
};

export default config;
