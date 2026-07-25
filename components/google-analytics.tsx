'use client';

import { usePathname } from 'next/navigation';
import Script from 'next/script';

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export default function PublicGoogleAnalytics() {
  const pathname = usePathname();

  if (!GA_ID || pathname.startsWith('/admin')) {
    return null;
  }

  return (
    <>
      <Script
        id="google-analytics"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
        strategy="lazyOnload"
      />
      <Script id="google-analytics-init" strategy="lazyOnload">
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}
      </Script>
    </>
  );
}
