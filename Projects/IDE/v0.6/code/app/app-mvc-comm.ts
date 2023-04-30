// AppMvcComm class

// Connects the app to the MVC framework (Vue, React, Angular, etc.)
// Anything relevant to the app that happens in the MVC framework is being sent here

// This is just an event bus, meaning it only translates strongly typed JavaScript
// method calls to events.

// Example:
//   appMvcComm.mvc.nodeValueChanged(this._.uid, `name`, `John Doe`);

import { Logger } from "~/code/util/logger";
import { RuntimeMvcComp, RuntimeMvcComps } from "~~/code/app/runtime-mvc-comp";
import { Events } from "~/code/util/events";
import { AppApplication } from "~/code/app/app-application";

class MvcToApp {
  private app: AppApplication;

  constructor(app: AppApplication) {
    this.app = app;
  }

  nodeValueChanged(mvcCompID: number | null, nodePath: string, value: any) {
    // Will automatically notify all the other classes that are interested in this event
    // AppEvents hooks automatically into this method
  }

  runtimeCompClicked(mvcCompID: number, nodePath: string, dataItems: any[]) {
    Logger.log(`🖱️`, `AppMvcComm`, `runtimeCompClicked`, nodePath, {
      mvcCompID,
      nodePath,
      dataItems,
    });

    this.nodeValueChanged(mvcCompID, nodePath, dataItems.last());
  }
}

class AppToMvc {
  private app: AppApplication;
  private rtMvcComps: RuntimeMvcComps = new RuntimeMvcComps();

  constructor(app: AppApplication) {
    this.app = app;
  }

  private after_MvcToApp_nodeValueChanged(
    mvcCompID: number | null,
    nodePath: string,
    value: any
  ) {
    this.app.state.set(nodePath, value, undefined);
  }

  private after_AppState_set(nodePath: string, value: any) {
    // Update the value in the UI MVC component(s)
    let mvcComps = this.rtMvcComps.get(nodePath);
    for (let mvcComp of mvcComps) mvcComp.getVue().setNodeValue(value);
  }

  // Register an MVC component
  registerMvc(mvcComp: RuntimeMvcComp) {
    let nodePath = mvcComp.nodePath.stringifyIds();
    this.rtMvcComps.add(nodePath, mvcComp);
  }

  // Unregister an MVC component
  unregisterMvc(mvcCompID: number) {
    this.rtMvcComps.delete(mvcCompID);
  }
}

class AppMvcComm {
  public mvc: MvcToApp;
  private app: AppToMvc;

  constructor(app: AppApplication) {
    this.mvc = new MvcToApp(app);
    this.app = new AppToMvc(app);

    app.events.bindToClass(this.mvc);
    app.events.bindToClass(this.app);
  }

  static async construct(app: AppApplication) {
    let comm = new AppMvcComm(app);
    return comm;
  }

  registerMvc(mvcComp: RuntimeMvcComp) {
    this.app.registerMvc(mvcComp);
  }

  unregisterMvc(mvcCompID: number) {
    this.app.unregisterMvc(mvcCompID);
  }
}

export { AppMvcComm };
