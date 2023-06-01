const { exec } = require("child_process");

class System {
  private static cpuStart = process.cpuUsage();

  static usage = {
    get memory() {
      return process.memoryUsage().heapUsed;
    },
    get cpu() {
      // Calculate the elapsed CPU time
      const endUsage = process.cpuUsage();
      const elapsedUserTime = endUsage.user - System.cpuStart.user;
      const elapsedSystemTime = endUsage.system - System.cpuStart.system;
      const elapsedCPUTime = elapsedUserTime + elapsedSystemTime;

      // Calculate the CPU percentage usage
      const totalElapsedTime = process.uptime() * 1000000; // Convert uptime to microseconds
      const cpuPercentage = elapsedCPUTime / totalElapsedTime;

      return cpuPercentage;
    },
  };

  static async restartComputer() {
    return new Promise((resolve, reject) => {
      exec("shutdown /r /t 0", (ex: any, stdout: any, stderr: any) => {
        if (ex) {
          reject(ex);
        }
      });
    });
  }
}

export { System };
