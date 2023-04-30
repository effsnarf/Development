import { msg } from "~/code/util/msg";
import { AppApplication } from "./app-application";

import { AppSource } from "./app-source";

// Responsible for executing app methods

class AppMethods {
  private methodExecutionDelay: number = 100;
  private methodArgs: Map<string, Map<string, any>> = new Map<
    string,
    Map<string, any>
  >();
  private methodTimers: Map<string, any> = new Map<string, any>();
  private app: AppApplication;

  constructor(app: AppApplication) {
    this.app = app;
  }

  static async construct(app: AppApplication) {
    let appMethods = new AppMethods(app);
    return appMethods;
  }

  setMethodArgument(
    nodePath: string,
    value: any,
    prevActionTempID: number | undefined
  ) {
    if (!this.methodArgs.has(nodePath))
      this.methodArgs.set(nodePath, new Map<string, any>());

    let args = this.methodArgs.get(nodePath) as Map<string, any>;

    args.set(`arg0`, value);

    this.enqueue(nodePath, prevActionTempID);
  }

  enqueue(nodePath: string, prevActionTempID: number | undefined) {
    clearTimeout(this.methodTimers.get(nodePath));

    this.methodTimers.set(
      nodePath,
      setTimeout(async () => {
        await this.execute(nodePath, prevActionTempID);
      }, this.methodExecutionDelay)
    );
  }

  async execute(nodePath: string, prevActionTempID: number | undefined) {
    // Find any layout nodes that are linked to this method
    // And inform them that we're loading
    let layoutNodes = this.app.links.getAllRelatedNodes(nodePath);
    console.log(layoutNodes);

    let method = this.app.source.methods.get(nodePath);
    let args = this.methodArgs.get(nodePath) || new Map<string, any>();
    let result = await this.runMethod(method, [...args.values()]);
    this.app.state.set(nodePath, result, prevActionTempID);
  }

  async runMethod(method: any, args: any[] = []) {
    msg.alert(`${method.name} (${args})`);

    try {
      let started = Date.now();

      let func = eval(`(async function(${method.args}) { ${method.body} })`);

      let result = await func.apply(null, args);

      let elapsed = Date.now() - started;
      msg.alert(`${method.name} (${elapsed}ms)`);

      return result;
    } catch (ex: any) {
      msg.error(`Error running method: ${method.name}: ${ex.message}`);
    }
  }
}

export { AppMethods };
