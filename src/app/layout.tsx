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
                  var errorMessage = (error && (error.message || error.toString())) || event.message || "";

                  var isChunkError =
                    /chunk|loading|unexpected token/i.test(errorMessage) ||
                    errorMessage.indexOf("CSS_CHUNK_LOAD_FAILED") !== -1;

                  var target = event.target || event.srcElement;
                  var isResourceError = target &&
                    (target.tagName === "SCRIPT" || target.tagName === "LINK") &&
                    (target.src || target.href || "").indexOf("/_next/static/") !== -1;

                  if (isChunkError || isResourceError) {
                    try {
                      var lastReload = sessionStorage.getItem("last-chunk-reload");
                      var now = Date.now();
                      if (!lastReload || now - parseInt(lastReload) > 5000) {
                        sessionStorage.setItem("last-chunk-reload", now.toString());
                        window.location.reload();
                      }
                    } catch (e) {
                      window.location.reload();
                    }
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