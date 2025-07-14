module ProcessOut {
  export type TokenizationFlowData = {
    flow: 'tokenization',
    customerId: string,
    customerTokenId: string
    invoiceId?: never
  }

  export type AuthorizationFlowData = {
    flow: 'authorization',
    invoiceId: `iv_${string}`
    customerId?: never,
    customerTokenId?: never,
  }

  export type FlowData = {
    gatewayConfigurationId: `gway_conf_${string}`
    initialData: Partial<InitialData>
    /** Whether user can cancel the payment (default: true) */
    allowCancelation: boolean
    /** Payment confirmation configuration */
    confirmation: {
      /** Whether user action is required for pending payments (default: false) */
      requiresAction: boolean
      /** Timeout in seconds to wait for payment confirmation (default: 900 e.g. 15 minutes) */
      timeout: number
      /** Whether user can cancel the payment during confirmation (default: true) */
      allowCancelation?: boolean
    }
    
    /** Success screen configuration */
    success: {
      /** Whether to show success screen (default: true) */
      enabled: boolean
      /** Duration in seconds when auto-dismissing (requiresAction: false) (default: 3) */
      autoDismissDuration: number
      /** Duration in seconds when manual dismissal required (requiresAction: true) (default: 60) */
      manualDismissDuration: number
      /** Whether user must take action to dismiss success screen (default: false) */
      requiresAction: boolean
    }
  }

  export type TokenizationUserData = TokenizationFlowData & FlowData
  export type AuthorizationUserData = AuthorizationFlowData & FlowData

  export type TokenizationUserOptions = Omit<TokenizationUserData, 'flow'>
  export type AuthorizationUserOptions = Omit<AuthorizationUserData, 'flow'>

  export type APMUserData = TokenizationUserData | AuthorizationUserData

  export type APMContext = {  } & APMUserData & {
    logger: {
      error(message: Omit<Parameters<TelemetryClient['reportError']>[0], 'stack'>): void;
      warn(message: Omit<Parameters<TelemetryClient['reportWarning']>[0], 'stack'>): void;
    }
    events: APMEventsImpl,
    poClient: ProcessOut,
    page: APMPageImpl,
    reload(): void
  }

  interface Context {
    initialise(context: APMContext): void
  }

  export class ContextImpl implements Context {
    static _instance: Context;
    private static initialised = false
    private static c = {} as APMContext
    private constructor() {}

    public static get instance(): Context {
      if (!this._instance) {
        this._instance = new ContextImpl();
      }

      return this._instance;
    }

    public static get context() {
      if (!this.initialised) {
        throw new Error('APM Context not initialised')
      }
      return this.c as APMContext
    }

    public initialise(context: APMContext) {
      ContextImpl.initialised = true;
      ContextImpl.c = context
    }
  }
}
