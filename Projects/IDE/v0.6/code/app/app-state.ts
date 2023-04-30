import { Utility } from "~/code/util/utility";
import { Events } from "~/code/util/events";
import { Action } from "~/code/action-stack/action-stack";
import { Actionable } from "~/code/action-stack/actionable";
import { AppApplication } from "./app-application";

class AppState extends Actionable {
  public values: Map<string, any> = new Map<string, any>();
  private app: AppApplication;

  public key = ref(1);

  constructor(app: AppApplication) {
    super();
    this.app = app;
  }

  static async construct(app: AppApplication) {
    let appState = new AppState(app);
    return appState;
  }

  get(nodePath: string): any {
    return this.values.get(nodePath);
  }

  set(nodePath: string, value: any, prevActionTempID: number | undefined) {
    if (this.isAlreadySet(nodePath, value)) return;

    let oldValue = this.values.get(nodePath);

    this.values.set(nodePath, value);

    this.stateChanged();

    // Create the undo action

    let nodeID = parseInt(nodePath.split(`.`).pop() as string);
    let nodeInfo = this.app.source.getNodeInfo(nodeID);
    let nodeDesc = `${nodeInfo.icon} ${nodeInfo.desc}`;

    let action = this.action({
      redo: [`✏️`, `set`, [nodePath, value], value],
      undo: [`✏️`, `set`, [nodePath, oldValue]],
      node: { _id: nodeID },
      prev: { temp: { id: prevActionTempID } },
    });

    action.redo.desc = nodeDesc;
    action.undo.desc = nodeDesc;

    return action;
  }

  isAlreadySet(nodePath: string, value: any): boolean {
    return Utility.areEqual(value, this.values.get(nodePath));
  }

  stateChanged() {
    this.key.value++;
  }
}

export { AppState };
