namespace Eff {
  export namespace Performance {
    interface Stat {
      invokes: number;
      duration: {
        average: number;
        measures: number;
        total: number;
      };
      startTime?: number;
    }

    export class Tracker {
      stats: { [key: string]: Stat } = {};

      private constructor() {}

      static new() {
        const tracker = new Tracker();
        return tracker;
      }

      track = {
        invoke: (name: string) => this.trackInvoke(name),
        start: (name: string) => this.trackDurationStart(name),
        stop: (name: string) => this.trackDurationStop(name),
      };

      private trackInvoke(name: string) {
        if (!this.stats[name]) {
          this.initializeStat(name);
        }
        this.stats[name].invokes++;
      }

      private trackDurationStart(name: string) {
        if (!this.stats[name]) {
          this.initializeStat(name);
        }
        this.stats[name].startTime = performance.now();
        this.stats[name].duration.measures++;
      }

      private trackDurationStop(name: string) {
        if (!this.stats[name] || !this.stats[name].startTime) {
          console.error(`No start time for ${name}`);
          return;
        }
        const endTime = performance.now();
        const duration = endTime - this.stats[name].startTime!;

        // Update total duration
        this.stats[name].duration.total += duration;

        // Update and round average duration
        this.stats[name].duration.average = Math.round(
          this.stats[name].duration.total / this.stats[name].duration.measures
        );
      }

      private initializeStat(name: string) {
        this.stats[name] = {
          invokes: 0,
          duration: {
            average: 0,
            measures: 0,
            total: 0,
          },
        };
      }
    }
  }
}

const perf = Eff.Performance;

export { perf as Performance };
