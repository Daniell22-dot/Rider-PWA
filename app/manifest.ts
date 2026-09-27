import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Ekshop Rider Portal",
    short_name: "Ekshop Rider",
    description: "Delivery agent portal for Ekshop.",
    start_url: "/agent",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#F4F4F4",
    theme_color: "#0E3D2B",
    icons: [
      { src: "/icon-192x192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}