import { useEffect, useState } from 'react';
import { Platform, useWindowDimensions } from 'react-native';

/**
 * Shared responsive toolkit. Phone-first breakpoints:
 *  <768  mobile     1 column
 *  768+  tablet     2 columns
 *  1024+ wide       3 columns
 *  1280+ desktop    4 columns
 *
 * Hydration-safe: until the app has mounted in the browser, dimensions are
 * reported as null/0 so the very first client render matches the static
 * (server-pre-rendered) HTML. Otherwise a width-aware layout branch would
 * differ between server and client and React would throw hydration error 418.
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const activeWidth = mounted ? width : 0;
  const isTablet = activeWidth >= 768;
  const isWide = activeWidth >= 1024;
  const isDesktop = activeWidth >= 1280;
  const isWeb = Platform.OS === 'web';

  const columns = (breakpoints: number[] = [1, 2, 3, 4]): number => {
    const [phone = 1, tablet = 2, small = 3, big = 4] = breakpoints;
    if (!mounted) return phone;
    if (isDesktop) return big;
    if (isWide) return small;
    if (isTablet) return tablet;
    return phone;
  };

  /** Percentage width for one grid item in `n` columns with a pixel gap. */
  const colWidth = (n: number, gap = 12): `${number}%` => {
    if (n <= 1) return '100%';
    if (!mounted || width <= 0) return '100%';
    const perGap = (gap * (n - 1)) / n;
    const usable = 100 / n - (perGap / width) * 100;
    return `${Math.max(usable, 5)}%`;
  };

  const contentMaxWidth = 1100;

  return {
    width: activeWidth,
    mounted,
    isTablet,
    isWide,
    isDesktop,
    isWeb,
    columns,
    colWidth,
    contentMaxWidth,
  };
}