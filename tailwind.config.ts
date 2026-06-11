import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#05080f",
        grass: "#19b36b",
        mint: "#a9f7d3",
        ink: "#f7fbff",
        panel: "#0d1420",
        line: "#233044",
        cupBlue: "#2f80ff",
        cupRed: "#ef3340",
        cupGold: "#f6c453",
        stadium: "#111b2a"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(47,128,255,.12), 0 18px 70px rgba(0,0,0,.34)",
        cup: "0 18px 70px rgba(0,0,0,.36), inset 0 1px 0 rgba(255,255,255,.04)"
      }
    }
  },
  plugins: []
};

export default config;
