const { exec } = require("child_process");

class System {
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
