import { styled } from 'styled-components';
import { Button } from '../../../../components';
import Input from '../Input';
import { GatewayUiDataType } from '../../../api-data';
import {
  Controller,
  FieldValues,
  SubmitHandler,
  useForm,
} from 'react-hook-form';
import { getErrorMessage } from '../../utils';
import { PrefilledDataType } from '../../../prefilled-data';

type PropsType = {
  data: GatewayUiDataType;
  prefilledData: PrefilledDataType;
  onSubmit: SubmitHandler<FieldValues>;
};

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledButtonWrapper = styled.div`
  margin: 20px auto 0 auto;
`;

const Form = ({ data, prefilledData, onSubmit }: PropsType) => {
  const { control, handleSubmit, formState } = useForm<Record<string, string>>({
    defaultValues: data.inputs?.reduce(
      (acc, input) => ({
        ...acc,
        [input.key]: prefilledData[input.key] ?? '',
      }),
      {}
    ),
  });

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      {data.inputs?.map((input) => (
        <Controller
          key={input.key}
          name={input.key}
          control={control}
          render={({ field }) => (
            <Input
              error={getErrorMessage(formState.errors[input.key])}
              label={input.name}
              {...field}
            />
          )}
          rules={{
            required: input.validation.required,
            maxLength: input.validation.length ?? undefined,
          }}
        />
      ))}
      <StyledButtonWrapper>
        <Button text={data.button?.text} />
      </StyledButtonWrapper>
    </StyledForm>
  );
};

export default Form;
