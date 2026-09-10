import type { Metadata } from "next";
import "./globals.css";
import { FloatingDockDemo } from "@/components/Home/FloatingDock";
import Footer from "@/components/Home/Footer";
import Header from "@/components/Home/Header";
import { CopilotKitProvider } from "@/components/CopilotKitProvider";
import { Spotlight } from "@/components/ui/Spotlight";

export const metadata: Metadata = {
  title: "CopilotMate",
  description:
    "Your AI-powered companion, seamlessly automating tasks and enhancing productivity with intuitive actions and smart assistance.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="/copilotkit-v2.css" />
      </head>
      <body>
        <Spotlight
          className="-top-40 -left-10 md:-left-32 md:-top-20 h-screen"
          fill="#8b5cf6"
        />
        <Spotlight className="top-28 left-80 h-[80vh] " fill="#a855f7" />
        <Spotlight className="-top-20 left-1/2 h-screen" fill="purple" />
        <CopilotKitProvider runtimeUrl="/api/copilotkit">
          <Header />
          {children}
          <FloatingDockDemo />
          <Footer />
        </CopilotKitProvider>
      </body>
    </html>
  );
}
