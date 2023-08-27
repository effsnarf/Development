const Vue = (window as any).Vue;

namespace Flow {
  class Runtime {
    nodeDatas: Map<number, any> = Vue.reactive(new Map<number, any>());
  }

  export class UserApp {
    runtime: Runtime = new Runtime();

    constructor() {}

    static new(): UserApp {
      return new UserApp();
    }
  }
}

export { Flow };
