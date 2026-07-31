import '../styles/globals.css';
import { Big_Shoulders_Display, Public_Sans, IBM_Plex_Mono } from 'next/font/google';

// Three faces, each with a job: Big Shoulders is modeled on
// city/highway signage lettering (headlines), Public Sans was built for
// civic/road-sign legibility (body text), IBM Plex Mono gives fares,
// distances, and dates a "digital odometer" treatment.
const display = Big_Shoulders_Display({
  subsets: ['latin'],
  weight: ['600', '700', '800'],
  variable: '--font-display',
});

const body = Public_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-body',
});

const mono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
});

export default function App({ Component, pageProps }) {
  return (
    <div className={`${display.variable} ${body.variable} ${mono.variable}`}>
      <Component {...pageProps} />
    </div>
  );
}
