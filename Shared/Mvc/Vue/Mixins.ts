import { Objects } from "../../Extensions.Objects.Client";
import { Timer } from "../../Timer";

type BeforeCompEvent = {
  vue: any;
  comp: string;
  type: string;
  name: string;
  args?: any[];
};

type AfterCompEvent = BeforeCompEvent & {
  ex?: any;
  result?: any;
  elapsed: number;
};

type BeforeCompEventCallback = (e: BeforeCompEvent) => void;
type AfterCompEventCallback = (e: AfterCompEvent) => void;

function wrapFunction(
  fn: Function,
  before: BeforeCompEventCallback,
  after: AfterCompEventCallback,
  vue: any,
  type: string,
  name: string | Function
) {
  return function (this: any, ...args: any[]) {
    let result: any;

    if (typeof name == "function") name = name(args) as string;

    const compEvent = { vue, comp: vue.$options._componentTag, type, name };

    before(compEvent);

    const timer = Timer.start();
    try {
      result = fn.apply(vue, args);
      // if the function returns a promise
      if (result instanceof Promise) {
        return result
          .then((r) => {
            const elapsed = timer.elapsed ?? 0;
            after({ ...compEvent, result: r, elapsed });
            return r;
          })
          .catch((ex) => {});
      } else {
        // sync function
        const elapsed = timer.elapsed ?? 0;
        after({ ...compEvent, result, elapsed });
        return result;
      }
    } catch (ex: any) {
      const elapsed = timer.elapsed ?? 0;
      const ex2 = !ex ? null : { message: ex.message, stack: ex.stack };
      after({ ...compEvent, ex: ex2, result, elapsed });
      throw ex;
    }
  };
}

const Mixins = {
  CompEventTracker(
    before: BeforeCompEventCallback,
    after: AfterCompEventCallback
  ): any {
    const mixin = {
      matchComp: (c: any) =>
        [
          "ide.",
          "ui.html.style",
          "ui.context.window",
          "ui.ticker",
          "ui.value",
          "ui.mouse",
        ].none((s) => c.name.startsWith(s)),

      created(this: any) {
        const vue = this;

        // Wrap $emit
        vue.$emit = wrapFunction(
          vue.$emit,
          before,
          after,
          vue,
          "🚀",
          (args: any[]) => args[0]
        );

        // Wrap methods
        const methods = vue.$options.methods || {};
        Object.keys(methods).forEach((methodName) => {
          if (methodName == "getItemKey") debugger;
          const method = methods[methodName] as Function;
          vue[methodName] = wrapFunction(
            method,
            before,
            after,
            vue,
            "🔴",
            methodName
          );
        });

        const exceptKeys = ["_asyncComputed", "_ide_activity", "_meow"];

        if (false) {
          // When modifying arrays, vue will not detect the old value correctly
          // This solves the issue
          const getWatchableData = (dataKey: string) => {
            const value = vue[dataKey];
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
                  const compName = vue.$options.name;
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
                    vue: vue,
                    type: "data",
                    name: dataKey,
                    oldValue,
                    newValue,
                    elapsed: 0,
                  };
                },
                {
                  deep: true,
                }
              );
            });
        }

        if (false) {
          // Wrap computed properties
          const computed = vue._computedWatchers || {};
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
                before,
                after,
                vue,
                "💡",
                computedName
              );
              computed[computedName].setter = wrapFunction(
                setter,
                before,
                after,
                vue,
                "💡",
                computedName
              );
            });

          // Wrap watchers
          const watchers = vue.$options.watch || {};
          Object.keys(watchers).forEach((watchKey) => {
            const originalWatcher = watchers[watchKey] as any;
            const handler = originalWatcher.handler || originalWatcher;
            const immediate = originalWatcher.immediate;
            const deep = originalWatcher.deep;
            const newHandler = wrapFunction(
              handler,
              before,
              after,
              vue,
              "👁️",
              watchKey
            );
            vue.$watch(watchKey, newHandler, {
              immediate,
              deep,
            });
          });
        }
      },
      updated(this: any) {},
      mounted(this: any) {
        return;
        after({
          vue: this,
          comp: this.$options._componentTag,
          type: "♻️",
          name: "mount",
          result: null,
          elapsed: 0,
        });
      },
      unmounted(this: any) {
        return;
        after({
          vue: this,
          comp: this.$options._componentTag,
          type: "♻️",
          name: "unmount",
          result: null,
          elapsed: 0,
        });
      },
    };

    return mixin;
  },
};

export { Mixins, BeforeCompEvent, AfterCompEvent };
