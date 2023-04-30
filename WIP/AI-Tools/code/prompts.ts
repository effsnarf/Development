class Example
{
    input!: string;
    title!: string;
    subtitle!: string;
    summary!: string;
    output!: string;

    constructor(obj: any)
    {
        Object.assign(this, obj);
    }
}

class Property
{
    name: string;
    
    constructor(obj: any)
    {
        this.name = obj[0];
    }

    static from(obj: any)
    {
        let def = obj[1];
        if (Array.isArray(def)) return new SelectionProperty(obj);
        return new Property(obj);
    }
}

class SelectionProperty extends Property
{
    options: string[];

    constructor(obj: any)
    {
        super(obj);
        this.options = obj[1];
    }
}

class Prompt
{
    name: string;
    props: Property[] = [];
    examples: Example[] = [];

    constructor(obj: any)
    {
        this.name = obj[0];
        this.props = Object.entries(obj[1])
            .filter(p => (p[0] != 'examples'))
            .map((prop: any) => Property.from(prop));
        this.examples = (obj[1].examples||[]).map((e: any) => new Example(e));
    }
}

class Category
{
    name: string;
    prompts: Prompt[] = [];

    constructor(obj: any)
    {
        this.name = obj[0];
        for (let prompt of Object.entries(obj[1]))
        {
            this.prompts.push(new Prompt(prompt));
        }
    }
}

class Prompts
{
    jsYaml!: any;
    categories!: Category[];

    constructor(jsYaml: any)
    {
        this.jsYaml = jsYaml;
    }

    static async construct(jsYaml: any)
    {
        let prompts = new Prompts(jsYaml);
        await prompts.load();
        return prompts;
    }

    async load()
    {
        let yamlObj = (await (await fetch("/_nuxt/code/prompts.yaml")).text());
        let obj = this.jsYaml.load(yamlObj);

        let cats = [];

        for (let cat of Object.entries(obj))
        {
            cats.push(new Category(cat));
        }

        console.log(cats);
    }
}


export { Prompts }
