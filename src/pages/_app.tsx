import { type AppType } from "next/app";
import { JetBrains_Mono, Sora } from "next/font/google";

import "~/styles/globals.css";

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

const MyApp: AppType = ({ Component, pageProps }) => {
  return (
    <div className={`${mono.variable} ${sora.variable} font-sans`}>
      <Component {...pageProps} />
    </div>
  );
};

export default MyApp;