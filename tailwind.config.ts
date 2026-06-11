import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pitch: "#07110d",
        grass: "#18a058",
        mint: "#9ff0c5",
        ink: "#e9fff4",
        panel: "#101816",
        line: "#26352f"
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(159,240,197,.12), 0 18px 70px rgba(0,0,0,.32)"
      }
    }
  },
  plugins: []
};

export default config;
