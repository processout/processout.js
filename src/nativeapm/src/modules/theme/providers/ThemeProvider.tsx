import * as React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeType, defaultTheme } from '../config';
import { mergeTheme } from '../utils';

type PropsType = {
  children: React.ReactElement;
  theme?: ThemeType;
};

const ThemeProvider = ({ children }: PropsType) => {
  const [theme, setTheme] = React.useState<ThemeType>(defaultTheme);

  React.useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data.theme) {
        setTheme(event.data.theme);
      }
    });
  }, []);

  return (
    <StyledThemeProvider theme={mergeTheme(theme)}>
      {children}
    </StyledThemeProvider>
  );
};

export default ThemeProvider;
