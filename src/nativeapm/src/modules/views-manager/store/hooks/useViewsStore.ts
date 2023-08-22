import * as React from 'react';
import { ViewsStoreContext } from '../providers';

const useViewsStore = () => {
  const viewsStoreContext = React.useContext(ViewsStoreContext);

  if (!viewsStoreContext) {
    throw new Error(
      'useViewsMachine must be used within a ViewsStoreContext.Provider'
    );
  }

  return viewsStoreContext;
};

export default useViewsStore;
