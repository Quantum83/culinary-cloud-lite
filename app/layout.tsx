import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Culinary Cloud | Free AI Recipe Manager & Cookbook",
  description:
    "Save recipes from any website, compare recipes side by side with AI, plan your meals, and generate smart grocery lists. Free, no account needed.",
  keywords:
    "recipe manager, recipe organizer, save recipes, recipe comparison, meal planner, grocery list, AI cookbook, recipe saver, online cookbook",
  metadataBase: new URL("https://www.culinary-cloud.com"),
  openGraph: {
    title: "Culinary Cloud | Free AI Recipe Manager & Cookbook",
    description:
      "Save recipes from any website, compare recipes side by side with AI, plan your meals, and generate smart grocery lists. Free, no account needed.",
    url: "https://www.culinary-cloud.com",
    siteName: "Culinary Cloud",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Culinary Cloud | Free AI Recipe Manager & Cookbook",
    description:
      "Save recipes from any website, compare recipes side by side with AI, plan your meals, and generate smart grocery lists.",
    creator: "@BasZak25",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <script
          defer
          src="https://static.cloudflareinsights.com/beacon.min.js"
          data-cf-beacon='{"token": "1762e98699a44b7db19bd9188fcef9fe"}'
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
