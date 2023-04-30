interface MethodSignature {
  name: string;
  args: string[];
}

interface ClassSignature {
  name: string;
  methods: MethodSignature[];
}

interface InstanceInfo {
  id: number;
}

// Takes this:
// [{"name":"ChatOpenAI","methods":[{"name":"constructor","args":["role","log"]},{"name":"send","args":["message"]},{"name":"sendSeveral","args":["messages"]},{"name":"deleteLastMessage","args":[]}]}]
// And returns a JavaScript class
// with each method calling await this._apiCall("ChatOpenAI", "send", [message])
class ApifyClient {
  static createClass(baseUrl: string, signature: ClassSignature) {
    const _apiCall1 = async function (
      this: any,
      method: string,
      args: any[] = []
    ) {
      if (method != "new" && !this._.id)
        throw new Error(
          `Use (await ${this._.name}.new()) to create a new instance.`
        );

      let url = `${(this as any)._.baseUrl}/${(this as any)._.name}`;
      if (this._.id) url += `/${this._.id}`;
      url += `/${method}`;

      let argsMap = this._getArgsMap(method, args);
      let queryString = Array.from(argsMap.keys())
        .map((key) => `${key}=${JSON.stringify(argsMap.get(key))}`)
        .join("&");

      let response;
      if (method !== "new") {
        response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(Object.fromEntries(argsMap)),
        });
      } else if (queryString?.length) {
        url += `?${queryString}`;
        response = await fetch(url);
      } else {
        response = await fetch(url);
      }

      let text = await response.text();
      if (text.length) {
        let json = JSON.parse(text);
        if (json.error) throw new Error(json.error);
        return json;
      }
    };

    const _getArgsMap1 = (method: string, args: string[]) => {
      let argsMap = new Map<string, string>();
      for (let i = 0; i < args.length; i++) {
        let meth = signature.methods.find((m) => m.name == method);
        if (!meth)
          throw new Error(`Method ${method} not found in ${signature.name}`);
        argsMap.set(meth.args[i], args[i]);
      }
      return argsMap;
    };

    const _getNewID = async function () {};

    let cls = class {
      _: InstanceInfo = {} as InstanceInfo;

      static async new() {
        var inst = new cls();
        inst._.id = (await inst._apiCall("new")).id as number;
        return inst;
      }

      _apiCall(method: string, ...args: any[]) {
        return _apiCall1.apply(this, [method, args]);
      }
      _getArgsMap(method: string, ...args: any[]) {
        return _getArgsMap1.apply(this, [method, args]);
      }
    };

    (cls.prototype as any)._ = {
      ...signature,
      baseUrl: baseUrl,
    };

    for (let method of signature.methods) {
      // @ts-ignore
      cls.prototype[method.name] = async function (...args) {
        return await this._apiCall(method.name, args);
      };
    }

    return cls;
  }

  static async createClasses(apiUrl: string) {
    // Make sure the URL doesn't end with a slash
    if (apiUrl.endsWith("/")) apiUrl = apiUrl.substring(0, apiUrl.length - 1);

    // Get the class signatures from the api
    let classSigs = (await (await fetch(apiUrl)).json()) as ClassSignature[];

    let classes = new Map<string, any>();

    // Create a class for each signature
    classSigs.forEach((sig) => {
      classes.set(sig.name, ApifyClient.createClass(apiUrl, sig));
    });

    // Return the classes as an object
    return Object.fromEntries(classes);
  }
}

export { ApifyClient };
