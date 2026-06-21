import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Carbon Footprint Awareness Platform',
  description: 'A conversational carbon coach with adaptive recommendations and testable emissions logic.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
