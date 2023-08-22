export type ThemeType = {
  colors: {
    primaryColor: string;
    secondaryColor: string;
    backgroundColor: string;
  };
};

export const defaultTheme: ThemeType = {
  colors: {
    primaryColor: 'coral',
    secondaryColor: '#fff',
    backgroundColor: '#fff',
  },
};
