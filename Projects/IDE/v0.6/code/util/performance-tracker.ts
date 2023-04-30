import { Reflection } from "./reflection";

class PerformanceTracker {
    private static instance: PerformanceTracker;
    private methodInvocationTimes: { [methodName: string]: number[] } = {};
    private methodTimeTotals: { [methodName: string]: number } = {};
    private methodInvocations: { [methodName: string]: number } = {};
  
    private constructor() {}
  
    static getInstance() {
      if (!PerformanceTracker.instance) {
        const pt = PerformanceTracker.instance = new PerformanceTracker();
        //setInterval(pt.print.bind(pt), 5000);
      }
      return PerformanceTracker.instance;
    }
  
    trackMethodExecutionStart(methodName: string) {
        let started = Date.now();
        let mit = this.methodInvocationTimes;
        mit[methodName] = (mit[methodName] || []);
        mit[methodName].push(started);
    }

    trackMethodExecutionEnd(methodName: string) {
        let stopped = Date.now();
        let mit = this.methodInvocationTimes;
        let started = mit[methodName].pop();
        if (started === undefined) throw new Error(`Wtf?!`);
        let elapsed = (stopped - started);

        let mtt = this.methodTimeTotals;
        mtt[methodName] = ((mtt[methodName] || 0) + elapsed);
    }
  
    trackMethodInvocation(methodName: string) {
      if (!this.methodInvocations[methodName]) {
        this.methodInvocations[methodName] = 1;
      } else {
        this.methodInvocations[methodName]++;
      }
    }
  
    print() {
        const items = [];
        const table = {};
      for (const methodName in this.methodTimeTotals) {
        const time = this.methodTimeTotals[methodName];
        const invocations = this.methodInvocations[methodName];
        const average = (time / invocations);
        const total = time;
        items.push({ name: methodName, data: { invocations, average, total } });
      }
      items.sort((a, b) => (b.data.invocations - a.data.invocations));
      items.forEach(item => (table as any)[item.name] = item.data);
      console.table(table);
    }
  
    track<T extends { constructor: Function }>(instance: T, deep: boolean = false) {
      Reflection.bindClassMethods(
        instance,
        (className, methodName, args) => {
          this.trackMethodInvocation(methodName);
          this.trackMethodExecutionStart(methodName);
        },
        (className, methodName, args, returnValue) => {
          this.trackMethodExecutionEnd(methodName);
        },
        deep
      );
    }
  }
  
export { PerformanceTracker }
