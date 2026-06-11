import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "BolãoApp - Copa do Mundo 2026",
    short_name: "BolãoApp",
    description:
      "Bolão entre amigos para apostar nos placares dos jogos da Copa do Mundo 2026.",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#07110d",
    theme_color: "#18a058",
    icons: [
      {
        src: "/img/icon.jpg",
        sizes: "1000x1000",
        type: "image/jpeg",
        purpose: "any maskable"
      }
    ]
  };
}
