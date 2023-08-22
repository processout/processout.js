import * as React from 'react';
import { AvailableConfigTypes, useConfig } from '../../widget-config';

type PrefilledDataProviderPropsType = {
  children: React.ReactElement | React.ReactElement[];
};

export type PrefilledDataType = Record<string, string>;

const initialPrefilledData = {};

export const PrefilledDataContext =
  React.createContext<PrefilledDataType>(initialPrefilledData);

const PrefilledDataProvider = ({
  children,
}: PrefilledDataProviderPropsType) => {
  const prefilledData = useConfig<PrefilledDataType>({
    configType: AvailableConfigTypes.PrefilledData,
    initialConfig: initialPrefilledData,
  });

  return (
    <PrefilledDataContext.Provider value={prefilledData}>
      {children}
    </PrefilledDataContext.Provider>
  );
};

export default PrefilledDataProvider;
