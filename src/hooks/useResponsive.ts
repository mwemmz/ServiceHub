import { Platform, useWindowDimensions } from 'react-native';

/**
 * Shared responsive toolkit. Phone-first breakpoints:
 *  <768  mobile     1 column
 *  768+  tablet     2 columns
 *  1024+ wide       3 columns
 *  1280+ desktop    4 columns
 */
export function useResponsive() {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isWide = width >= 1024;
  const isDesktop = width >= 1280;
  const isWeb = Platform.OS === 'web';

  const columns = (breakpoints: number[] = [1, 2, 3, 4]): number => {
    const [phone = 1, tablet = 2, small = 3, big = 4] = breakpoints;
    if (isDesktop) return big;
    if (isWide) return small;
    if (isTablet) return tablet;
    return phone;
  };

  /** Percentage width for one grid item in `n` columns with a pixel gap. */
  const colWidth = (n: number, gap = 12): `${number}%` => {
    if (n <= 1 || width <= 0) return '100%';
    const perGap = (gap * (n - 1)) / n;
    const usable = 100 / n - (perGap / width) * 100;
    return `${Math.max(usable, 5)}%`;
  };

  const contentMaxWidth = 1100;

  return { width, isTablet, isWide, isDesktop, isWeb, columns, colWidth, contentMaxWidth };
}