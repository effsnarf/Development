interface Array<T> {
  last(): any;
  sortBy(project: (item: T) => any): T[];
  distinct(project?: ((item: T) => any) | null): T[];
  stringify(): string;
}

interface Function {
  getArgumentNames(): string[];
}

if (typeof Function !== "undefined") {
  Function.prototype.getArgumentNames = function () {
    const code = this.toString();
    const args = code
      .slice(code.indexOf("(") + 1, code.indexOf(")"))
      .match(/([^\s,]+)/g);
    return args || [];
  };
}

if (typeof Array !== "undefined") {
  Array.prototype.last = function () {
    return this[this.length - 1];
  };

  Array.prototype.sortBy = function (project: (item: any) => any) {
    return this.sort((a, b) => {
      const a1 = project(a);
      const b1 = project(b);
      if (a1 < b1) return -1;
      if (a1 > b1) return 1;
      return 0;
    });
  };

  Array.prototype.distinct = function (project?: ((item: any) => any) | null) {
    if (!project) project = (item) => item;
    const result = [] as any[];
    const map = new Map();
    for (const item of this) {
      const key = project ? project(item) : item;
      if (!map.has(key)) {
        map.set(key, true);
        result.push(item);
      }
    }
    return result;
  };

  Array.prototype.stringify = function (): any {
    return JSON.stringify(this);
  };
}

const util = {
  date: {
    timeAgo: (ts) => {
      if (typeof ts !== "number") ts = ts.valueOf();
      const seconds = Math.floor((new Date().valueOf() - ts) / 1000);
      let interval = Math.floor(seconds / 31536000);
      if (interval > 1) return `${interval} years`;
      interval = Math.floor(seconds / 2592000);
      if (interval > 1) return `${interval} months`;
      interval = Math.floor(seconds / 86400);
      if (interval > 1) return `${interval} days`;
      interval = Math.floor(seconds / 3600);
      if (interval > 1) return `${interval} hours`;
      interval = Math.floor(seconds / 60);
      if (interval > 1) return `${interval} minutes`;
      return `${Math.floor(seconds)} seconds`;
    },
  },
  number: {
    friendly: (num: number) => {
      if (num < 1000) return num;
      if (num < 1000000) return `${(num / 1000).toFixed(2)}k`;
      if (num < 1000000000) return `${(num / 1000000).toFixed(2)}m`;
    },
  },
  removeDuplicateSpaces: (s: string) => {
    return s.replace(/\s+/g, " ");
  },
  toUrlFriendly: (s: string) => {
    return s.replace(/\s+/g, "-");
  },
};
