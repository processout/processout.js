type PropsType = {
  text: string;
};

const Message = ({ text }: PropsType) => {
  return <div>{text}</div>;
};

export default Message;
