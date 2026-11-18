export const meta = (title: string, description: string) => ({
  meta: [
    { title: `${title} · MarketScope` },
    { name: "description", content: description },
    { property: "og:title", content: `${title} · MarketScope` },
    { property: "og:description", content: description },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ],
});