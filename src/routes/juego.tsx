import { createFileRoute } from "@tanstack/react-router";
import Game from "@/game/Game";

const title = "Spark Isles — Play the Python island adventure";
const description = "Practice beginner Python in Spark Isles: five single-exercise islands and a final island with five mixed challenges.";

export const Route = createFileRoute("/juego")({
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
