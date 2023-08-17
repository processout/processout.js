import { FormContainer } from '../../../form';
import { PrefilledDataProvider } from '../../../prefilled-data';

const FormView = () => {
  return (
    <PrefilledDataProvider>
      <FormContainer />
    </PrefilledDataProvider>
  );
};

export default FormView;
