import React from "react";
import { Metadata } from "next";
import HomePageClient from "./HomePageClient";

export const metadata: Metadata = {
  title: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place - Gobokin",
  description: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place",
  openGraph: {
    title: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place - Gobokin",
    description: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place - Gobokin",
    description: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place",
  },
};

export default function HomePage() {
  return <HomePageClient />;
}
