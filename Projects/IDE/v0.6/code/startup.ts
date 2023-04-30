

import { Workspace } from "~/code/workspace/workspace";


class Startup {
    ws!: Workspace;

    static async construct() {
        let startup = new Startup();
        await startup.init();
        return startup;
    }

    async init() {
        this.ws = (await Workspace.construct());
    }
}


export default Startup;
