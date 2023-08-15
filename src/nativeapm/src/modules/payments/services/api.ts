export type ResponseType = {
  native_apm: {
    gateway: {
      customer_action_image_url: string;
      customer_action_message: string;
      display_name: string;
      logo_url: string;
    };
    invoice: {
      amount: string;
      currency_code: string;
    };
    parameters: {
      key: string;
      type: string;
      required: boolean;
      length: number | null;
      display_name: string;
    }[];
  };
};

const response: ResponseType = {
  native_apm: {
    gateway: {
      customer_action_image_url:
        'https://js.processout.com/images/native-apm-assets/blik_customer_action_image.png',
      customer_action_message:
        'To complete the payment please confirm it from your banking app.',
      display_name: 'ProcessOut test gateway',
      logo_url: 'https://www.processout.com/images/logo.png',
    },
    invoice: {
      amount: '13',
      currency_code: 'PLN',
    },
    parameters: [
      {
        key: 'email',
        type: 'email',
        required: true,
        length: null,
        display_name: 'Email',
      },
    ],
  },
};

const getGatewayConfiguration = () => response;

export default {
  getGatewayConfiguration,
};
