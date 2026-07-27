import React from "react";
import { Metadata } from "next";
import EventDiscoveryClient from "./EventDiscoveryClient";

export const metadata: Metadata = {
  title: "Explore Events | Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place - Gobokin",
  description: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place",
  openGraph: {
    title: "Explore Events | Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place - Gobokin",
    description: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore Events | Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place - Gobokin",
    description: "Book venue | Sell Ticket | Reserve Venue | Buy Ticket and Manage venue all in one place",
  },
};

export default function EventsPage() {
  return <EventDiscoveryClient />;
}
