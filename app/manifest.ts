import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ekshop Rider Portal",
    short_name: "Ekshop Rider",
    description: "Delivery agent portal for Ekshop.",
    start_url: "/agent",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#0E3D2B",
    icons: [
      { src: "/logo.webp", sizes: "any", type: "image/webp" },
    ],
  };
}