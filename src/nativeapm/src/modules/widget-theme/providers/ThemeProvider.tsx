import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { ThemeType, defaultTheme } from '../config';
import { mergeTheme } from '../utils';
import { AvailableConfigTypes, useConfig } from '../../widget-config';

type PropsType = {
  children: React.ReactElement;
  theme?: ThemeType;
};

const ThemeProvider = ({ children }: PropsType) => {
  const theme = useConfig<ThemeType>({
    configType: AvailableConfigTypes.Theme,
    initialConfig: defaultTheme,
  });

  return (
    <StyledThemeProvider theme={mergeTheme(theme)}>
      {children}
    </StyledThemeProvider>
  );
};

export default ThemeProvider;
