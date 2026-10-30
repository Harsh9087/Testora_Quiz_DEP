import type { Metadata, Viewport } from "next";
import "./globals.css";
import "katex/dist/katex.min.css";
import Providers from "./providers/Providers";
import InstallPwaModal from "../components/InstallPwaModal";
import NavigationProgress from "../components/NavigationProgress";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#F8FAFC",
};

export const metadata: Metadata = {
  title: "Testora Quiz - AI Dynamic Examination & Student Management System",
  description: "Testora Quiz Enterprise SaaS Examination platform for schools, colleges, and corporations.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Testora Quiz",
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning data-scroll-behavior="smooth">
      <head>
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Testora Quiz" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="Testora Quiz" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('testora_user_preferences');
                  var parsed = stored ? JSON.parse(stored).state : null;
                  
                  // 1. Theme (Defaults cleanly to light mode; only enables dark if explicitly set to 'dark')
                  var savedMode = localStorage.getItem('theme_mode') || localStorage.getItem('theme');
                  var isDark = savedMode === 'dark';
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.setAttribute('data-theme', 'light');
                  }

                  // 2. Font family
                  var font = (parsed && parsed.font_family) || 'inter';
                  document.documentElement.setAttribute('data-font', font);

                  // 3. Text scale
                  var scale = (parsed && parsed.text_scale) || 100;
                  document.documentElement.style.setProperty('--font-scale', scale + '%');

                  // 4. Density
                  var density = (parsed && parsed.interface_density) || 'standard';
                  document.documentElement.setAttribute('data-density', density);

                  // 5. Accessibility tokens
                  if (parsed && parsed.high_contrast) document.documentElement.setAttribute('data-contrast', 'high');
                  if (parsed && parsed.reduced_motion) document.documentElement.setAttribute('data-motion', 'reduced');
                  if (parsed && parsed.high_focus) document.documentElement.setAttribute('data-focus', 'high');
                  if (parsed && parsed.language) document.documentElement.setAttribute('lang', parsed.language);
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased min-h-screen selection:bg-blue-600/20 selection:text-blue-900 dark:selection:text-blue-200">
        <NavigationProgress />
        <Providers>
          {children}
          <InstallPwaModal />
        </Providers>
      </body>
    </html>
  );
}
