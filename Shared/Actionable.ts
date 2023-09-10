import { Events } from "./Events";
import { Data } from "./Data";
import { Objects } from "./Extensions.Objects.Client";
import { TaskQueue } from "./TaskQueue";

namespace Actionable {
  export interface Doable {
    method: string;
    args: any[];
    noop?: boolean;
  }

  export interface Action {
    _id: number;
    redo: Doable;
    undo: Doable;
    parent?: { _id: number };
  }

  export interface ActionResult {
    action: Action;
    returnValue: any;
  }

  export interface ActionOptions {
    isUndoing?: boolean;
  }

  class ActionPointer {
    _id!: Data.Value<number>;
    action: Action | null = null;
    isFirstAction: boolean = false;
    isLastAction: boolean = false;
    events = new Events();

    private constructor(
      persister: Data.Persister.Base,
      private actions: Data.List
    ) {}

    static async new(
      persister: Data.Persister.Base,
      actions: Data.List
    ): Promise<ActionPointer> {
      const actionPointer = new ActionPointer(persister, actions);
      actionPointer._id = await Data.Value.new<number>(
        persister,
        "action.pointer",
        null
      );
      const firstAction = await actionPointer.actions.getItemAt(0);
      actionPointer.isFirstAction =
        actionPointer._id.value === firstAction?._id;
      return actionPointer;
    }

    async set(action: Action) {
      this._id.value = action._id;
      this.action = action;
      const firstAction = await this.actions.getItemAt(0);
      const lastAction = (await this.actions.getNewest())[0];
      this.isFirstAction = this._id.value === firstAction?._id;
      this.isLastAction = this._id.value === lastAction?._id;
      this.events.emit("change");
    }
  }

  export class ActionStack {
    actions!: Data.List;
    isRolledBack: boolean = false;
    doneAction!: ActionPointer;
    taskQueue!: TaskQueue;
    methodStack: number[] = [];
    methodStack2: number[] = [];
    idToId: { [id: number]: number } = {};
    events = new Events();

    toPersistableAction: (action: Action) => Promise<any> = async (
      action: Action
    ) => action;
    fromPersistableAction: (action: any) => Promise<Action> = async (
      action: Action
    ) => action;

    executeAction!: (
      action: Action,
      options?: ActionOptions
    ) => Promise<Action>;

    private constructor(
      private persister: Data.Persister.Base,
      private varName: string
    ) {
      this.taskQueue = new TaskQueue();
    }

    static async new(
      persister: Data.Persister.Base,
      varName: string
    ): Promise<ActionStack> {
      const actionStack = new ActionStack(persister, varName);

      actionStack.actions = await Data.List.new(
        persister,
        `${varName}.actions`
      );

      actionStack.doneAction = await ActionPointer.new(
        persister,
        actionStack.actions
      );

      actionStack.doneAction.events.on("change", () =>
        actionStack.events.emit("change")
      );

      actionStack.ensureNoopAction();

      return actionStack;
    }

    async do(action: Action | any) {
      action = await this.fromPersistableAction(action);
      action = await this._executeAction(action);
      if (!action) throw new Error("executeAction must return an action");
      if (!action.undo) throw new Error("executeAction must set action.undo");
      await this.add(action);
    }

    async enteringMethod() {
      const actionID = await this.actions.getNewID();
      this.methodStack.push(actionID);
    }

    async add(action: Action | any, options?: { exitingMethod?: boolean }) {
      action = Objects.clone(action);

      if (options?.exitingMethod) {
        if (this.methodStack.length) {
          const newActionID = this.methodStack.pop();
          action._id = newActionID;
          if (this.methodStack.length) {
            action.parent = {
              _id: this.methodStack[this.methodStack.length - 1],
            };
          }
        }
      }

      action = await this.toPersistableAction(action);

      if (!this.doneAction.isLastAction)
        await this.actions.deleteMany(
          (action: Action) => action._id > this.doneAction._id.value
        );
      await this.actions.upsert(action);

      if (options?.exitingMethod && !this.methodStack.length) {
        // Exited the method stack
        // Now we want to reverse all the action ids in the method call stack
        const ids = this.methodStack2;
        const idToId = ids.toMap((a, i) => ids[ids.length - i - 1]) as any;
        const stackActions = await this.actions.getNewest(ids.length);
        for (const stackAction of stackActions) {
          stackAction._id = idToId[stackAction._id];
          if (stackAction.parent)
            stackAction.parent._id = idToId[stackAction.parent._id];
        }
        await this.actions.upsertMany(stackActions);
        this.methodStack2.clear();
      }

      this.doneAction.set(action);
    }

    async goToAction(toActionID: number) {
      if (this.doneAction._id.value > toActionID) {
        while (this.doneAction._id.value > toActionID) {
          await this.undo();
          return;
        }
      }
      if (this.doneAction._id.value < toActionID) {
        while (this.doneAction._id.value < toActionID) {
          await this.redo();
          return;
        }
      }
    }

    async getActions(parentID?: number): Promise<Action[]> {
      return await this.actions.getMany(
        (action: Action) => action.parent?._id === parentID
      );
    }

    async getAllActions(): Promise<Action[]> {
      return await this.actions.getMany((a) => true);
    }

    async undo(count: number = 1) {
      if (count < 1) return;
      for (let i = 0; i < count; i++) {
        await this._undo();
      }
    }

    async _undo() {
      if (this.doneAction.isFirstAction) return;
      if (!this.doneAction.action) return;
      const action = this.invertAction(this.doneAction.action);
      await this._executeAction(action, { isUndoing: true });
      const index = await this.actions.getIndex(this.doneAction._id.value);
      if (index == null) throw new Error("Action not found");
      this.doneAction.set(await this.actions.getItemAt(index - 1));
    }

    async redo() {
      if (this.doneAction.isLastAction) return;
      if (!this.doneAction.action) return;
      const nextAction = await this.getNextAction();
      await this._executeAction(nextAction);
      this.doneAction.set(nextAction);
    }

    async clear() {
      await this.actions.clear();
      await this.ensureNoopAction();
      this.doneAction.set((await this.actions.getNewest())[0]);
    }

    private async getNextAction(): Promise<Action> {
      const index = await this.actions.getIndex(this.doneAction._id.value);
      if (index == null) throw new Error("Action not found");
      return await this.actions.getItemAt(index + 1);
    }

    private invertAction(action: Action): Action {
      action = Objects.clone(action);
      const redo = action.redo;
      const undo = action.undo;
      action.redo = undo;
      action.undo = redo;
      return action;
    }

    private async ensureNoopAction() {
      if (this.actions.count === 0) {
        // Add a blank action to start
        await this.do({
          redo: { noop: true },
          undo: { noop: true },
        });
      }
    }

    private async _executeAction(action: Action, options?: ActionOptions) {
      action = Objects.clone(action);

      if (action.redo.noop) {
        return action;
      }

      return await this.executeAction(action, options);
    }
  }
}

export { Actionable };
