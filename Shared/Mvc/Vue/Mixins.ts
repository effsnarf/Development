import { Objects } from "../../Extensions.Objects.Client";

interface CompEvent {
  context: any;
  type: string;
  name: string;
  elapsed: number;
}

type AfterCompEventCallback = (compEvent: CompEvent) => void;

class CallbackQueue {
  private tcbs = {} as { [key: string]: Function };

  constructor(private callback: AfterCompEventCallback) {}

  enqueue(compEvent: CompEvent) {
    this.callback(compEvent);
    return;
    //if (elapsed < 10) return;
    const contextName = compEvent.context.$options.name;
    const key = `${contextName}.${compEvent.type}.${compEvent.name}`;
    const tcb = (this.tcbs[key] = this.tcbs[key] || this.createTcb());
    tcb(compEvent);
  }

  // Some operations are called very frequently, so we throttle them
  private createTcb() {
    return (compEvent: CompEvent) => {
      this.callback(compEvent);
    };
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

    const compEvent = { context: this, type, name };

    try {
      result = fn.apply(this, args);
    } catch (err) {
      const end = performance.now();
      const elapsed = Math.round(end - start);
      callbackQueue.enqueue({ ...compEvent, elapsed });
      throw err; // Synchronous error
    }

    // If the function returns a promise, handle it asynchronously
    if (result instanceof Promise) {
      return result.finally(() => {
        const end = performance.now();
        callbackQueue.enqueue({
          ...compEvent,
          elapsed: Math.round(end - start),
        });
      });
    } else {
      // Handle synchronous functions
      const end = performance.now();
      callbackQueue.enqueue({ ...compEvent, elapsed: Math.round(end - start) });
      return result;
    }
  };
}

const Mixins = {
  CompEventTracker(afterCompEvent: AfterCompEventCallback): any {
    const origAfterCompEvent = afterCompEvent;
    afterCompEvent = (compEvent: CompEvent) => {
      origAfterCompEvent(compEvent);
    };

    const callbackQueue = new CallbackQueue(afterCompEvent);

    const mixin = {
      matchComp: (c: any) =>
        ["ide.", "ui.value", "ui.mouse"].none((s) => c.name.startsWith(s)),

      created(this: any) {
        const vue = this;

        // Wrap methods
        const methods = this.$options.methods || {};
        Object.keys(methods).forEach((methodName) => {
          const originalMethod = methods[methodName] as Function;
          methods[methodName] = wrapFunction(
            originalMethod,
            callbackQueue,
            vue,
            "method",
            methodName
          );
        });

        const exceptKeys = ["_asyncComputed", "_ide_activity", "_meow"];

        // When modifying arrays, vue will not detect the old value correctly
        // This solves the issue
        const getWatchableData = (dataKey: string) => {
          const value = this[dataKey];
          switch (Objects.getTypeName(value)) {
            case "string":
            case "number":
            case "boolean":
            case "date":
            case "regexp":
            case "function":
            case "null":
            case "undefined":
              return value;
            case "array":
              return [...(value as any[])];
            case "object":
              if (value.constructor.name == "Object") {
                return Object.assign({}, value);
              } else {
                const compName = this.$options.name;
                // Watching a class instance
                // Need to think about this
                if (false) {
                  (window as any).alertify
                    .warning(
                      `<h2>⚠️ 📦 ${compName} 🧊 ${dataKey}</h2><p>Activity tracking is disabled for 📦 ${compName} 🧊 ${dataKey}.</p><p>Use plain objects or primitives for data, not class instances.</p>`
                    )
                    .delay(0);
                }
                return null;
              }
          }
        };

        if (false) {
          // Wrap data properties
          const data = this._data || {};
          Object.keys(data)
            .except(...exceptKeys)
            .forEach((dataKey) => {
              const originalData = data[dataKey];
              // Create a watcher for each data property
              this.$watch(
                function () {
                  return getWatchableData(dataKey);
                },
                (newValue: any, oldValue: any) => {
                  const compEvent = {
                    context: vue,
                    type: "data",
                    name: dataKey,
                    oldValue,
                    newValue,
                    elapsed: 0,
                  };
                  callbackQueue.enqueue(compEvent);
                },
                {
                  deep: true,
                }
              );
            });
        }

        // Wrap computed properties
        const computed = this._computedWatchers || {};
        Object.keys(computed)
          .except(...exceptKeys)
          .filter((cn) => !cn.startsWith("_"))
          .filter((cn) => !cn.startsWith("$"))
          .forEach((computedName) => {
            const originalComputed = computed[computedName];
            const getter = originalComputed.getter;
            const setter = originalComputed.setter;

            computed[computedName].getter = wrapFunction(
              getter,
              callbackQueue,
              vue,
              "computed",
              computedName
            );
            computed[computedName].setter = wrapFunction(
              setter,
              callbackQueue,
              vue,
              "computed",
              computedName
            );
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
            originalWatcher.handler,
            callbackQueue,
            vue,
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
        afterCompEvent({
          context: this,
          type: "update",
          name: "update",
          elapsed: end - this._updateStart,
        });
      },
      mounted(this: any) {
        afterCompEvent({
          context: this,
          type: "mount",
          name: "mount",
          elapsed: 0,
        });
      },
      unmounted(this: any) {
        afterCompEvent({
          context: this,
          type: "unmount",
          name: "unmount",
          elapsed: 0,
        });
      },
    };

    return mixin;
  },
};

export { Mixins, CompEvent };
