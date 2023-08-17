import { styled } from 'styled-components';
import { Button } from '../../../../components';
import Input from '../Input';
import { GatewayUiDataType } from '../../../payments';
import {
  Controller,
  FieldValues,
  SubmitHandler,
  useForm,
} from 'react-hook-form';

type PropsType = {
  data: GatewayUiDataType;
  onSubmit: SubmitHandler<FieldValues>;
};

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
`;

const StyledButtonWrapper = styled.div`
  margin: 20px auto 0 auto;
`;

const Form = ({ data, onSubmit }: PropsType) => {
  const { control, handleSubmit, formState } = useForm();

  return (
    <StyledForm onSubmit={handleSubmit(onSubmit)}>
      {data.inputs.map((input) => (
        <Controller
          key={input.key}
          name={input.key}
          control={control}
          render={({ field }) => (
            <Input
              error={formState.errors[input.key] && 'You must enter the e-mail'}
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
        <Button text={data.button.text} />
      </StyledButtonWrapper>
    </StyledForm>
  );
};

export default Form;
