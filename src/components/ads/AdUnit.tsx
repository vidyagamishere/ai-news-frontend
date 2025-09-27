import React, { useEffect, useRef } from 'react';
import { trackAdImpression, trackAdClick } from '../../utils/analytics';
import './AdUnit.css';

interface AdUnitProps {
  adSlot: string;
  adFormat?: 'auto' | 'rectangle' | 'horizontal' | 'vertical';
  responsive?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export default function AdUnit({ 
  adSlot, 
  adFormat = 'auto', 
  responsive = true,
  className = '',
  style = {}
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isAdLoaded = useRef(false);

  // Get AdSense configuration
  const clientId = 'ca-pub-1971460159522427';
  const adsEnabled = import.meta.env.VITE_ENABLE_ADS === 'true';
  
  // Don't render anything if ads are disabled or no client ID
  if (!adsEnabled) {
    return null;
  }

  useEffect(() => {
    // Only proceed if ads are enabled
    if (!adsEnabled || !clientId) return;

    // Load Google AdSense script if not already loaded
    if (!window.adsbygoogle) {
      const script = document.createElement('script');
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
      
      // Initialize adsbygoogle array
      window.adsbygoogle = [];
    }

    // Initialize ad after component mounts
    if (adRef.current && !isAdLoaded.current) {
      try {
        // Ensure adsbygoogle exists before pushing
        if (window.adsbygoogle) {
          window.adsbygoogle.push({});
          isAdLoaded.current = true;
          
          // Track ad impression
          trackAdImpression(adSlot, adFormat);
        }
      } catch (error) {
        console.warn('AdSense error:', error);
      }
    }
  }, [adsEnabled, clientId, adSlot, adFormat]);

  // Show placeholder if no client ID
  if (!clientId) {
    return (
      <div className={`ad-container ad-placeholder-container ${className}`} style={style}>
        <div className="ad-label">Advertisement</div>
        <div className="ad-placeholder">
          <p>Ad Space</p>
          <small>Slot: {adSlot}</small>
        </div>
      </div>
    );
  }

  return (
    <div className={`ad-container ${className}`} style={style}>
      <div className="ad-label">Advertisement</div>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={clientId}
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive ? 'true' : 'false'}
        onClick={() => trackAdClick(adSlot, adFormat)}
      />
    </div>
  );
}