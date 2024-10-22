import { BeforeCompEvent, AfterCompEvent, Mixins } from "./Mixins";
import { TreeBuilder, TreeNode } from "../../DataStruct";
import { Counter } from "../../Counter";
import { Objects } from "../../Extensions.Objects.Client";

class VueDebugger {
  is = {
    enabled: false,
  };
  mixin: any;
  invokes = new Counter();
  exec = {
    log: [] as any[],
    stack: [] as any[],
  };

  constructor() {
    this.mixin = this.getMixin();
  }

  before(e: BeforeCompEvent) {
    this.invokes.increment(`${e.type} ${e.name}`);
    if (!this.is.enabled) return;
    this.exec.stack.push(Objects.clone(e, { exclude: ["vue"] }));
  }

  after(e: AfterCompEvent) {
    if (!this.is.enabled) return;
    this.exec.log.push(Objects.clone(e, { exclude: ["vue"] }));
    if (this.exec.log.length > 100) this.exec.log.shift();
    if (!e.ex) {
      this.exec.stack.pop();
    } else {
      console.log(this.exec.stack);
      this.exec.stack = [];
    }
  }

  getMixin(): any {
    return Mixins.CompEventTracker(
      this.before.bind(this),
      this.after.bind(this)
    );
  }
}

export { VueDebugger };
