import type { Metadata } from 'next';
import Image from 'next/image';
import './globals.css';

export const metadata: Metadata = {
  title: 'Team 1 Jury Tracker',
  description: 'Club HashCash Hashathon Bounty Grading Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <main className="container">
          <header className="page-header" style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Image 
              src="/logo.svg" 
              alt="Team 1 Logo" 
              width={200} 
              height={50} 
              priority
              style={{ objectFit: 'contain' }}
            />
            <h1 className="page-title" style={{ marginLeft: 'auto', fontSize: '1.5rem', color: '#aaaaaa' }}>
               Jury Tracker
            </h1>
          </header>
          {children}
        </main>
      </body>
    </html>
  );
}
