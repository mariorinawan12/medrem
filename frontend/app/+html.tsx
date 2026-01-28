import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

/**
 * This file is web-only and used to configure the root HTML for every page.
 * It wraps all routes in the `app` directory.
 */
export default function Root({ children }: PropsWithChildren) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover"
                />

                {/* PWA Meta Tags */}
                <meta name="theme-color" content="#4CAF50" />
                <meta name="description" content="Medication Reminder - Never miss your medication" />

                {/* iOS Specific Meta Tags for PWA (REQUIRED FOR FULLSCREEN) */}
                <meta name="apple-mobile-web-app-capable" content="yes" />
                <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
                <meta name="apple-mobile-web-app-title" content="MedReminder" />

                {/* Android Specific Meta Tags for PWA */}
                <meta name="mobile-web-app-capable" content="yes" />
                <meta name="application-name" content="MedReminder" />

                {/* iOS Icons */}
                <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

                {/* Manifest */}
                <link rel="manifest" href="/manifest.json" />

                {/* Favicons */}
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />

                {/* Reset scroll behavior */}
                <ScrollViewStyleReset />

                {/* App styles */}
                <style dangerouslySetInnerHTML={{ __html: responsiveStyles }} />
            </head>
            <body>{children}</body>
        </html>
    );
}

const responsiveStyles = `
  html, body, #root {
    width: 100%;
    height: 100%;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    -webkit-overflow-scrolling: touch;
  }
`;
