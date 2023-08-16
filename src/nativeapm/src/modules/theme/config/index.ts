export type ThemeType = {
  colors: {
    primaryColor: string;
    secondaryColor: string;
  };
};

export const defaultTheme: ThemeType = {
  colors: {
    primaryColor: 'coral',
    secondaryColor: '#fff',
  },
};
