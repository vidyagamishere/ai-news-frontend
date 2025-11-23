import { useState, useEffect } from 'react';

/**
 * Device type categories based on viewport width
 */
export type DeviceType = 'mobile' | 'tablet' | 'desktop';

/**
 * Detailed device information
 */
export interface DeviceInfo {
  type: DeviceType;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  width: number;
  height: number;
  orientation: 'portrait' | 'landscape';
  isTouch: boolean;
}

/**
 * Breakpoints (matching Tailwind defaults)
 */
export const BREAKPOINTS = {
  mobile: 0,      // 0px - 767px
  tablet: 768,    // 768px - 1023px
  desktop: 1024,  // 1024px+
} as const;

/**
 * Get device type based on viewport width
 */
const getDeviceType = (width: number): DeviceType => {
  if (width < BREAKPOINTS.tablet) return 'mobile';
  if (width < BREAKPOINTS.desktop) return 'tablet';
  return 'desktop';
};

/**
 * Get orientation based on dimensions
 */
const getOrientation = (width: number, height: number): 'portrait' | 'landscape' => {
  return width < height ? 'portrait' : 'landscape';
};

/**
 * Check if device has touch support
 */
const isTouchDevice = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  return (
    'ontouchstart' in window ||
    navigator.maxTouchPoints > 0 ||
    // @ts-ignore - for older browsers
    navigator.msMaxTouchPoints > 0
  );
};

/**
 * Custom hook to detect device type and dimensions
 * 
 * @example
 * ```tsx
 * const { isMobile, isTablet, isDesktop, type, width } = useDeviceType();
 * 
 * if (isMobile) {
 *   return <MobileLayout />;
 * }
 * ```
 */
export const useDeviceType = (): DeviceInfo => {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo>(() => {
    // Initial state (SSR-safe)
    if (typeof window === 'undefined') {
      return {
        type: 'desktop',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        width: 1920,
        height: 1080,
        orientation: 'landscape',
        isTouch: false,
      };
    }

    const width = window.innerWidth;
    const height = window.innerHeight;
    const type = getDeviceType(width);

    return {
      type,
      isMobile: type === 'mobile',
      isTablet: type === 'tablet',
      isDesktop: type === 'desktop',
      width,
      height,
      orientation: getOrientation(width, height),
      isTouch: isTouchDevice(),
    };
  });

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleResize = () => {
      // Debounce resize events (improves performance)
      clearTimeout(timeoutId);
      
      timeoutId = setTimeout(() => {
        const width = window.innerWidth;
        const height = window.innerHeight;
        const type = getDeviceType(width);

        setDeviceInfo({
          type,
          isMobile: type === 'mobile',
          isTablet: type === 'tablet',
          isDesktop: type === 'desktop',
          width,
          height,
          orientation: getOrientation(width, height),
          isTouch: isTouchDevice(),
        });
      }, 150); // 150ms debounce
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return deviceInfo;
};

/**
 * Simpler hook that just returns device type string
 * 
 * @example
 * ```tsx
 * const deviceType = useDeviceTypeSimple();
 * console.log(deviceType); // 'mobile' | 'tablet' | 'desktop'
 * ```
 */
export const useDeviceTypeSimple = (): DeviceType => {
  const { type } = useDeviceType();
  return type;
};

/**
 * Hook to check specific breakpoint
 * 
 * @example
 * ```tsx
 * const isMobile = useBreakpoint('mobile');
 * const isTabletOrLarger = useBreakpoint('tablet');
 * ```
 */
export const useBreakpoint = (breakpoint: keyof typeof BREAKPOINTS): boolean => {
  const { width } = useDeviceType();
  return width >= BREAKPOINTS[breakpoint];
};

/**
 * Hook for media query matching
 * 
 * @example
 * ```tsx
 * const isSmall = useMediaQuery('(max-width: 640px)');
 * const isDark = useMediaQuery('(prefers-color-scheme: dark)');
 * ```
 */
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia(query);
    
    const handleChange = (e: MediaQueryListEvent) => {
      setMatches(e.matches);
    };

    // Modern browsers
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } 
    // Legacy browsers
    else {
      // @ts-ignore
      mediaQuery.addListener(handleChange);
      // @ts-ignore
      return () => mediaQuery.removeListener(handleChange);
    }
  }, [query]);

  return matches;
};