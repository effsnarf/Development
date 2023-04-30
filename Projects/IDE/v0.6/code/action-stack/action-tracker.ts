// Used to track actions from methods that are invoked in classes,
// as opposed to actions that are invoked in the ActionStack class (like UI actions, etc).
//
// Whenever ActionStack.undo() or redo() is called, we're pausing the action tracker.

import { msg } from "~/code/util/msg";
import { Utility } from "~/code/util/utility";
import { Reflection } from "~/code/util/reflection";
import { AppEvents } from "~/code/app/app-events";
import { ModuleManager } from "~/code/module-manager";
import { ActionStack, Action } from "./action-stack";

class ActionTracker
{
    private mm: ModuleManager;
    private actionStack: ActionStack;

    constructor(mm: ModuleManager, actionStack: ActionStack)
    {
        this.mm = mm;
        this.actionStack = actionStack;

        // We want to pause the action tracker whenever undo/redo is called.
        // We hook into the action stack's undo/redo methods to do this.
        let appEvents = (new AppEvents());
        appEvents.bindToClass(this);
        appEvents.bindToClass(this.actionStack);
    }

    static async construct(mm: ModuleManager, actionStack: ActionStack)
    {
        let actionTracker = new ActionTracker(mm, actionStack);
        return actionTracker;
    }

    track(modules: any, moduleNames: string[])
    {
        for (let moduleName of moduleNames)
        {
            let module = modules[moduleName];
            this.mm.register(moduleName, module);
            this.bindToClass(module);
        }
    }

    private bindToClass(obj: any)
    {
        Reflection.bindClassMethods(obj, null, this.afterTrackedMethodInvoked.bind(this));
    }

    private async afterTrackedMethodInvoked(className: string, methodName: string, args: any[], returnValue: any)
    {
        if (!ActionStack.isAction(returnValue)) return;

        let action = (returnValue as Action);

        await this.actionStack.add(action);
    }
}


export { ActionTracker }
