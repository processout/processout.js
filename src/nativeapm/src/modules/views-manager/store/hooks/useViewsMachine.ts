import { useMachine } from '@xstate/react';
import { viewsMachine } from '../machines';

const useViewsMachine = () => {
  const [state, send] = useMachine(viewsMachine);

  return {
    state,
    send,
  };
};

export default useViewsMachine;
