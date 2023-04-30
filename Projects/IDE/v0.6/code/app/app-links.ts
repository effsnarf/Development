import { Action } from "../action-stack/action-stack";
import { AppApplication } from "./app-application";

import { AppSource } from "./app-source";
import { AppState } from "./app-state";

// Whenever AppState.set() is called, this class will propogate the value to any linked nodes

class AppLinks {
  private app: AppApplication;

  constructor(app: AppApplication) {
    this.app = app;
  }

  static async construct(app: AppApplication) {
    let appLinks = new AppLinks(app);
    return appLinks;
  }

  private after_AppState_set(
    nodePath: string,
    value: any,
    prevActionTempID: number | undefined = undefined,
    prevAction: Action
  ) {
    this.propogate(nodePath, value, prevAction?.temp.id);
  }

  // Get all the nodes that are related to the given node
  // Following the chain of links recursively
  getAllRelatedNodes(nodePath: string) {
    let relatedNodes = new Set<string>();

    let tos = this.app.source.links.get(nodePath) || [];

    for (let to of tos) {
      relatedNodes.add(to);
      this.getAllRelatedNodes(to).forEach((node) => relatedNodes.add(node));
    }

    return relatedNodes;
  }

  private async propogate(
    nodePath: string,
    value: any,
    prevActionTempID: number
  ) {
    // Find the relevant links
    let tos = this.app.source.links.get(nodePath) || [];

    for (let to of tos) {
      if (this.app.source.methods.has(to)) {
        this.app.methods.setMethodArgument(to, value, prevActionTempID);
        continue;
      }

      if (this.app.state.isAlreadySet(to, value)) continue;

      this.app.state.set(to, value, prevActionTempID);
    }
  }
}

export { AppLinks };
