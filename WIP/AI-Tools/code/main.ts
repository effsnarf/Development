import { Prompts } from "./prompts";

class Main
{
    constructor()
    {
    }

    static async construct(jsYaml: any)
    {
        let prompts = await Prompts.construct(jsYaml);
    }
}


export { Main }
