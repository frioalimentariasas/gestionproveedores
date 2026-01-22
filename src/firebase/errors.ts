export type SecurityRuleContext = {
  path: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete' | 'write';
  requestResourceData?: any;
};

// This is a custom error class that is used to represent a
// Firestore permission error. It is used by the `FirebaseErrorListener`
// component to display a toast notification when a permission error occurs.
export class FirestorePermissionError extends Error {
  constructor(public context: SecurityRuleContext) {
    super('Firestore Permission Denied');
    this.name = 'FirestorePermissionError';
  }

  toObject() {
    return {
      name: this.name,
      message: this.message,
      context: this.context,
    };
  }
}
