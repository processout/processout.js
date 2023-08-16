import { ThemeType, defaultTheme } from '../config';

export const mergeTheme = (theme?: ThemeType) => {
  if (!theme) {
    return defaultTheme;
  }
  console.log('theme from mergeTheme', theme);
  return {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      ...theme.colors,
    },
  };
};
