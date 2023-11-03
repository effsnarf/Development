const deepDiff = require("deep-diff");

namespace Diff {
  interface Item {
    kind: string;
    rhs: any;
  }

  interface Change {
    kind: string;
    path: string[];
    lhs?: any;
    rhs?: any;
    index?: number;
    item?: Item;
  }

  export function getChanges(source: any, target: any): Change[] {
    return deepDiff.diff(source, target);
  }

  export function applyChanges(target: any, changes: Change[]): any {
    target = JSON.parse(JSON.stringify(target));
    for (const change of changes) {
      deepDiff.applyChange(target, target, change);
    }
    return target;
  }
}

export { Diff };
