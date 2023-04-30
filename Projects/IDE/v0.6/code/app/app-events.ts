import { Events } from '~/code/util/events';
import { Reflection } from '~/code/util/reflection';

// Whenever a method is invoked on any of the app classes,
// other classes that are interested in that method are automatically notified.
//
// Example:
//   AppState.set(`name`, `John Doe`);
//   AppLinks.after_AppState_set(key, value) { ... };

class AppEvents extends Events {
    private classMethodHandlers: Map<string, Function[]> = new Map<string, Function[]>();

    constructor(options: any = {}) {
        super(options);
        this.on("*", this.onClassMethodEvent.bind(this));
    }

    // Whenever a method is called on any of the app classes,
    // notify all the other classes that are interested in that method.
    private onClassMethodEvent(eventName: string, e: { instance: any, args: any[], returnValue: any }) {
        let methodName = `${eventName.replace(/\./g, "_")}`;
        (this.classMethodHandlers.get(methodName) || [])
            .forEach(handler => handler(...e.args, e.returnValue));
    }

    bindToClass<T extends { constructor: Function }>(instance: any) {
        let className = instance.constructor.name;

        // Keep track of all the handlers on the classes
        Reflection.getMethodNames(instance)
            .filter(m => [`before_`, `after_`].some(prefix => m.startsWith(prefix)))
            .forEach(methodName => {
                let handlers = this.classMethodHandlers.get(methodName) || [];
                handlers.push(instance[methodName].bind(instance));
                this.classMethodHandlers.set(methodName, handlers);
            });
        
        // Whenever a method is called on the class, emit an event
        // to notify everyone that is interested in that method.
        Reflection.bindClassMethods(instance,
            (className, methodName, args) => {
                let eventName = `before.${className}.${methodName}`;
                this.emit(eventName, { instance, args });
            },
            (className, methodName, args, returnValue) => {
            let eventName = `after.${className}.${methodName}`;
            this.emit(eventName, { instance, args, returnValue });
        });
    }
}
  
  
export { AppEvents }
