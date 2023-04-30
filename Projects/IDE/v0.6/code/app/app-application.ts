import { Reflection } from "~/code/util/reflection";
import { Utility } from "~/code/util/utility";

import { NodePath } from "~/code/persisted/persisted-tree";
import { AppEvents } from "./app-events";

import { RuntimeMvcComp } from "~~/code/app/runtime-mvc-comp";

import { Database } from "~/code/database/database";

import { ActionStack } from "~/code/action-stack/action-stack";
import { AppSource } from "./app-source";
import { AppState } from "./app-state";
import { AppLinks } from "./app-links";
import { AppMethods } from "./app-methods";
import { AppMvcComm } from "./app-mvc-comm";
import { ActionTracker } from "~/code/action-stack/action-tracker";
import { ModuleManager } from "../module-manager";

interface IAppApplication {
  mvcNodeValueChanged(
    mvcCompID: number | null,
    nodePath: string,
    value: any
  ): void;
  registerMvc(mvcComp: RuntimeMvcComp): void;
  unregisterMvc(mvcCompID: number): void;
}

class AppApplication implements IAppApplication {
  public events: AppEvents;
  public source: AppSource;
  public state!: AppState;
  public links!: AppLinks;
  public methods!: AppMethods;
  public comm!: AppMvcComm;
  public actions!: ActionStack;

  constructor(source: AppSource, db: Database, idKey: any) {
    this.events = new AppEvents({ log: false });

    this.source = source;
  }

  static async construct(source: AppSource, db: Database, idKey: any) {
    let app = new AppApplication(source, db, idKey);

    app.state = await AppState.construct(app);
    app.links = await AppLinks.construct(app);
    app.methods = await AppMethods.construct(app);
    app.comm = await AppMvcComm.construct(app);

    app.events.bindToClass(app.state);
    app.events.bindToClass(app.links);
    app.events.bindToClass(app.methods);

    let mm = new ModuleManager();
    app.actions = await ActionStack.construct(mm, db, idKey);
    let actionTracker = await ActionTracker.construct(mm, app.actions);
    actionTracker.track(app, [`state`]);

    return app;
  }

  mvcNodeValueChanged(mvcCompID: number | null, nodePath: string, value: any) {
    this.comm.mvc.nodeValueChanged(mvcCompID, nodePath, value);
  }

  registerMvc(mvcComp: RuntimeMvcComp) {
    this.comm.registerMvc(mvcComp);
  }

  unregisterMvc(mvcCompID: number) {
    this.comm.unregisterMvc(mvcCompID);
  }
}

export { IAppApplication, AppApplication };
