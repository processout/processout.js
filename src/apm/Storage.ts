module ProcessOut {
    class Storage {
        private static instance: Storage;

        private constructor() {}

        public static getInstance(): Storage {
            if (!Storage.instance) {
                Storage.instance = new Storage();
            }
            return Storage.instance;
        }

        public set<V extends string | boolean | number>(key: string, value: V): void {
            sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
        }
        
        public get<V extends string | boolean | number >(key: string, defaultValue?: V): V {
            const value = sessionStorage.getItem(this.getKey(key));
            
            if (value === null) {
                this.set(key, defaultValue);
                return defaultValue;
            }

            return JSON.parse(value);
        }

        private getKey(key: string): string {
            const { context } = ContextImpl;
            const id = context.invoiceId || `${context.customerId}:${context.customerTokenId}`;
            return `pojs.apm.${id}.${key}`;
        }
        
    }

    export const storage = Storage.getInstance();
}
