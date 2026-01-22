import { EventEmitter } from 'events';
import { FirestorePermissionError } from './errors';

type Events = {
  'permission-error': (error: FirestorePermissionError) => void;
};

// This is a simple event emitter that is used to broadcast errors
// to the rest of the application.
// It is used by the `FirebaseErrorListener` component to display
// toast notifications when a permission error occurs.
class ErrorEmitter extends EventEmitter {
  emit<E extends keyof Events>(event: E, ...args: Parameters<Events[E]>) {
    return super.emit(event, ...args);
  }

  on<E extends keyof Events>(event: E, listener: Events[E]) {
    return super.on(event, listener);
  }

  off<E extends keyof Events>(event: E, listener: Events[E]) {
    return super.off(event, listener);
  }
}

export const errorEmitter = new ErrorEmitter();
