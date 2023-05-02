namespace Types {
  export interface Address {
    protocol: "http" | "https";
    host: string;
    port: number;
  }

  export const Convert = {
    address: {
      from: {
        any: (address: any) => {
          if (typeof address === "object")
            return {
              protocol: address.protocol || "http",
              host: address.host,
              port: address.port || 80,
            } as any;
          else if (typeof address === "string")
            return Convert.address.from.string(address);
          else throw new Error("Invalid address type");
        },
        string: (s: string) => {
          const i = s.startsWith("http") ? 0 : -1;
          const parts = s.split(":");
          const protocol = i < 0 ? "http" : (parts[i + 0] as "http" | "https");
          const host = parts[i + 1].replace("//", "");
          const port = parseInt(parts[i + 2] || "80");
          return { protocol, host, port };
        },
      },
      to: {
        string: (address: Address) => {
          return `${address.protocol.gray}${`://`.gray}${address.host.yellow}:${
            address.port.toString().green
          }`;
        },
      },
    },
  };

  export function stringify(obj: any, typeName?: string) {
    if (!typeName) typeName = Types.detectType(obj);
    if (typeName)
      return (Types.Convert as any)[typeName.toCamelCase()].to.string(obj);
    else return JSON.stringify(obj);
  }

  export function detectType(obj: any): string {
    throw new Error("Function not implemented.");
  }
}

export { Types };
