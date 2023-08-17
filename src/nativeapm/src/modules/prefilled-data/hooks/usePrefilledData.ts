import * as React from 'react';
import { PrefilledDataContext } from '../providers/';

const usePrefilledData = () => {
  const prefilledData = React.useContext(PrefilledDataContext);

  if (!prefilledData) {
    throw new Error(
      'usePrefilledData must be used within a PrefilledDataProvider'
    );
  }

  return prefilledData;
};

export default usePrefilledData;
