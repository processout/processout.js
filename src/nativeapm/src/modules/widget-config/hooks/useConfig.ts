import * as React from 'react';

export enum AvailableConfigTypes {
  Payment = 'payment',
  Theme = 'theme',
  PrefilledData = 'prefilledData',
}

type UseConfigArgs = {
  configType: AvailableConfigTypes;
  initialConfig: unknown;
};

const useConfig = <ConfigType>({
  configType,
  initialConfig,
}: UseConfigArgs) => {
  const [config, setConfig] = React.useState<ConfigType>(
    <ConfigType>initialConfig
  );

  React.useEffect(() => {
    window.addEventListener('message', (event) => {
      if (event.data[configType]) {
        setConfig(event.data[configType]);
      }
    });
  }, [setConfig, configType]);

  return config;
};

export default useConfig;
