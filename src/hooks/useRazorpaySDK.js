import { useState, useEffect } from 'react';

export function useRazorpaySDK() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (window.Razorpay) { setReady(true); return; }
    const s = document.createElement('script');
    s.src     = 'https://checkout.razorpay.com/v1/checkout.js';
    s.async   = true;
    s.onload  = () => setReady(true);
    s.onerror = () => console.error('Failed to load Razorpay SDK');
    document.head.appendChild(s);
  }, []);

  return ready;
}
