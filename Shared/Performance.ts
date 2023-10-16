namespace Eff {
  export namespace Performance {
    interface Stat {
      invokes: number;
      duration: {
        average: number;
        measures: number;
        total: number;
      };
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
        elapsed: (name: string, elapsed: number) =>
          this.trackDurationElapsed(name, elapsed),
      };

      private trackInvoke(name: string) {
        this.initializeStat(name);
        this.stats[name].invokes++;
      }

      private trackDurationElapsed(name: string, elapsed: number) {
        this.initializeStat(name);

        // Update total duration
        this.stats[name].duration.total += elapsed;
        // Update number of measures
        this.stats[name].duration.measures++;

        // Update and round average duration
        this.stats[name].duration.average = Math.round(
          this.stats[name].duration.total / this.stats[name].duration.measures
        );
      }

      private initializeStat(name: string) {
        if (this.stats[name]) return;
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
