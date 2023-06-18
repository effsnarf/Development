class Component {
  name: string;
  path: string;
  source: any;

  constructor(obj: any) {
    this.name = obj.name;
    this.path = obj.path;
    this.source = obj.source;
    if (this.source) this.source.name = this.name.replace(/\./g, "-");
  }
}

export { Component };
