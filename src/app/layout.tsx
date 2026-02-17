import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { UIProvider } from "@/context/UIContext";
import LayoutWrapper from "@/components/LayoutWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gobokin",
  description: "Book halls for your events",
  icons: {
    icon: '/favicon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var handleChunkError = function(event) {
                  var error = event.error || event.reason || (event.detail && event.detail.reason);
                  var errorMessage = (error && error.message) || event.message || "";
                  if (
                    errorMessage.indexOf("Failed to load chunk") !== -1 ||
                    errorMessage.indexOf("Loading chunk") !== -1 ||
                    errorMessage.indexOf("Unexpected token") !== -1
                  ) {
                    try {
                      var lastReload = sessionStorage.getItem("last-chunk-reload");
                      var now = Date.now();
                      if (!lastReload || now - parseInt(lastReload) > 10000) {
                        sessionStorage.setItem("last-chunk-reload", now.toString());
                        window.location.reload();
                      }
                    } catch (e) {}
                  }
                };
                window.addEventListener("error", handleChunkError, true);
                window.addEventListener("unhandledrejection", handleChunkError);
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AuthProvider>
          <UIProvider>
            <LayoutWrapper>{children}</LayoutWrapper>
          </UIProvider>
        </AuthProvider>
      </body>
    </html>
  );
}