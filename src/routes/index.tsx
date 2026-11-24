import { createFileRoute } from "@tanstack/react-router";
import Game from "@/game/Game";

const title = "Spark Isles — Daily Python practice for beginners";
const description = "A blocky 3D adventure: explore six islands and solve bite-sized Python exercises every day.";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&family=Pixelify+Sans:wght@400;600&family=Press+Start+2P&display=swap" },
    ],
  }),
  component: Game,
});
