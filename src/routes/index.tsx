import { createFileRoute } from "@tanstack/react-router";
import { Library } from "@/components/tome/Library";

export const Route = createFileRoute("/")({
  ssr: false, // library reads local on-device storage
  head: () => ({
    meta: [
      { title: "Tome — Your files, bound together" },
      { name: "description", content: "A local-first multimedia book creator and reader." },
      { property: "og:title", content: "Tome — Your files, bound together" },
      { property: "og:description", content: "Turn documents, images, audio and video into beautiful personal books." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Library,
});
