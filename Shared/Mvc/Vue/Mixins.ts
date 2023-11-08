interface Operation {
  context: any;
  type: string;
  name: string;
}

interface Measurement {
  operation: Operation;
  elapsed: number;
}

type AfterOperationCallback = (measurement: Measurement) => void;

class CallbackQueue {
  private tcbs = {} as { [key: string]: Function };

  constructor(private callback: AfterOperationCallback) {}

  enqueue(m: Measurement) {
    //if (measurement.elapsed < 10) return;
    const contextName = m.operation.context.$options._componentTag;
    const key = `${contextName}.${m.operation.type}.${m.operation.name}`;
    const tcb = (this.tcbs[key] = this.tcbs[key] || this.createTcb());
    tcb(m);
  }

  // Some operations are called very frequently, so we throttle them
  private createTcb() {
    return ((m: Measurement) => {
      this.callback(m);
    }).throttle(10, this);
  }
}

function wrapFunction(
  fn: Function,
  callbackQueue: CallbackQueue,
  context: any,
  type: string,
  name: string
) {
  return function (this: any, ...args: any[]) {
    const start = performance.now();
    let result: any;

    const operation = { context, type, name };

    try {
      result = fn.apply(this, args);
    } catch (err) {
      const end = performance.now();
      callbackQueue.enqueue({ operation, elapsed: end - start });
      throw err; // Synchronous error
    }

    // If the function returns a promise, handle it asynchronously
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        callbackQueue.enqueue({ operation, elapsed: end - start });
      });
    } else {
      // Handle synchronous functions
      const end = performance.now();
      callbackQueue.enqueue({ operation, elapsed: end - start });
      return result;
    }
  };
}

const Mixins = {
  OperationTracker(afterOperation: AfterOperationCallback): any {
    const origAfterOperation = afterOperation;
    afterOperation = (measurement: Measurement) => {
      origAfterOperation(measurement);
    };

    const callbackQueue = new CallbackQueue(afterOperation);

    const mixin = {
      created(this: any) {
        // Wrap methods
        const methods = this.$options.methods || {};
        Object.keys(methods).forEach((methodName) => {
          const originalMethod = methods[methodName] as Function;
          methods[methodName] = wrapFunction(
            originalMethod,
            callbackQueue,
            this,
            "method",
            methodName
          );
        });

        // Wrap computed properties
        const computed = this.$options.computed || {};
        Object.keys(computed).forEach((computedName) => {
          const originalComputed = computed[computedName];
          const getter =
            typeof originalComputed === "function"
              ? originalComputed
              : originalComputed.get;
          const setter = originalComputed.set;

          computed[computedName] = {
            get: wrapFunction(
              getter,
              callbackQueue,
              this,
              "computed",
              computedName
            ),
            set: setter,
          };
        });

        return;

        // Wrap watchers
        const watchers = this.$options.watch || {};
        Object.keys(watchers).forEach((watchKey) => {
          const originalWatcher = watchers[watchKey] as any;
          const handler = originalWatcher.handler || originalWatcher;
          const immediate = originalWatcher.immediate;
          const deep = originalWatcher.deep;
          const newHandler = wrapFunction(
            originalWatcher,
            callbackQueue,
            this,
            "watcher",
            watchKey
          );
          this.$watch(watchKey, newHandler, {
            immediate,
            deep,
          });
          return;
          if (typeof originalWatcher === "function") {
            watchers[watchKey] = wrapFunction(
              originalWatcher,
              callbackQueue,
              this,
              "watcher",
              watchKey
            );
          } else if (
            originalWatcher &&
            typeof originalWatcher.handler === "function"
          ) {
            const handler = originalWatcher.handler;
            originalWatcher.handler = wrapFunction(
              handler,
              callbackQueue,
              this,
              "watcher",
              watchKey
            );
          }
        });
      },
      beforeUpdate(this: any) {
        this._updateStart = performance.now();
      },
      updated(this: any) {
        return;
        const end = performance.now();
        afterOperation({
          operation: { context: this, type: "update", name: "update" },
          elapsed: end - this._updateStart,
        });
      },
      mounted(this: any) {
        afterOperation({
          operation: { context: this, type: "mount", name: "mount" },
          elapsed: 0,
        });
      },
      unmounted(this: any) {
        afterOperation({
          operation: { context: this, type: "unmount", name: "unmount" },
          elapsed: 0,
        });
      },
    };

    return mixin;
  },
};

export { Mixins };
