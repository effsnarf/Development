// ModuleManager class
// This class is responsible for loading and managing modules in the runtime environment.
// Used so that modules can be referenced by name, which allows queueing of methods to be executed.

class ModuleManager {
    /// The modules that have been registered
    modules: Record<string, any>;

    constructor() {
        this.modules = {};
    }

    get(oid: string): any {
        return this.modules[oid];
    }

    async register(oid: string, module: any) {
        module.moduleName = oid;
        module.oid = oid;
        this.modules[oid] = module;
        return module;
    }

    async registerNew(oid: string, moduleClass: any, args: any[]) {
        let module = (await moduleClass.construct(oid, ...(args || [])));
        this.register(oid, module);
        return module;
    }

    getModuleIcon(oid: string) {
        let module = this.modules[oid];
        if (!module) return `❓`;
        return module.icon || `📦`;
    }

    /// Invoke a method on a module
    /// Supports (oid, method, args) and ({ oid, method, args }) formats
    async invoke(...invokeArgs: any[]) {
        // Get the oid, method, and args
        let { oid, method, args } = (this._getInvokeArgs(invokeArgs));
        // Get the module
        let module = this.modules[oid];
        // If the module doesn't exist
        if (!module) throw new Error(`Module ${oid} not found.`);
        // Get the method
        let methodFunc = module[method];
        // If the method doesn't exist
        if (!methodFunc) throw new Error(`Method ${method} not found on module ${oid}.`);
        // Invoke the method
        let action = (await methodFunc.apply(module, args));
        // Return the action
        return action;
    }

    /// Get the oid, method, and args from the invoke arguments
    _getInvokeArgs(invokeArgs: any[] | object) {
        // If invokeArgs is an array
        if (Array.isArray(invokeArgs)) {
            // If there's only one argument, it is an { oid, method, args } object
            if (invokeArgs.length === 1) return invokeArgs[0];
            // Otherwise, it is an [oid, method, args] array
            let [oid, method, args] = invokeArgs;
            return { oid, method, args };
        }
        // Otherwise, it is a { oid, method, args } object
        else return invokeArgs;
    }
}


export { ModuleManager };
