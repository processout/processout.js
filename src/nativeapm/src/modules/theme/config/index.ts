export type ThemeType = {
  colors: {
    primary: string;
    secondary: string;
    tertiary: string;
  };
};

export const defaultTheme: ThemeType = {
  colors: {
    primary: '#000',
    secondary: '#fff',
    tertiary: '#f0f0f0',
  },
};
