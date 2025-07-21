module ProcessOut {
  export class UpdatedReadOnly extends Error {
    readonly property: string;
    constructor(property: string) {
      super("Cannot update a read-only property")
      this.name = 'UpdatedReadOnly';
      this.property = property;

      Object.setPrototypeOf(this, UpdatedReadOnly.prototype);
    }
  }
}
