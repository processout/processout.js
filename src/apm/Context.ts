module ProcessOut {
  export type TokenizationFlowData = {
    flow: 'tokenization',
    tokenizationId: string
  }

  export type AuthorizationFlowData = {
    flow: 'authorization',
    tokenizationId?: never
  }

  export type FlowData = {
    gatewayConfigurationId: `gway_conf_${string}`
    invoiceId: `iv_${string}`
    initialData?: Partial<InitialData>
  }

  export type TokenizationUserData = TokenizationFlowData & FlowData
  export type AuthorizationUserData = AuthorizationFlowData & FlowData

  export type TokenizationUserOptions = Omit<TokenizationUserData, 'flow'>
  export type AuthorizationUserOptions = Omit<AuthorizationUserData, 'flow'>

  export type APMUserData = TokenizationUserData | AuthorizationUserData

  export type APMContext = APMUserData & {
    logger: {
      error(message: Omit<Parameters<TelemetryClient['reportError']>[0], 'stack'>): void;
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
