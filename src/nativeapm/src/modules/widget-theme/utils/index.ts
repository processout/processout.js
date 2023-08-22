import { ThemeType, defaultTheme } from '../config';

export const mergeTheme = (theme?: ThemeType) => {
  if (!theme) {
    return defaultTheme;
  }

  return {
    ...defaultTheme,
    colors: {
      ...defaultTheme.colors,
      ...theme.colors,
    },
  };
};
