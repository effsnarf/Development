import * as colors from "colors";
import { Loading } from "./Loading";

class RateLimiter {
  private _lastRequest: Map<string, number> = new Map();
  private _limits: Map<string, number> = new Map();

  setLimit(type: string, ms: number) {
    this._limits.set(type, ms);
  }

  async limit(types: string[]) {
    for (const type of types) {
      await this._limit(type);
    }
  }

  private async _limit(type: string) {
    const limit = this._limits.get(type);
    if (!limit) throw new Error(`No limit set for type ${type}`);
    const lastRequest = this._lastRequest.get(type) || Date.now();
    if (this.isLimited(type)) {
      let loading = Loading.startNew(`${type} rate limit`);
      while (this.isLimited(type)) {
        await this.sleep(50);
      }
      loading.stop();
    }
    this._lastRequest.set(type, Date.now());
  }

  isLimited(type: string) {
    const limit = this._limits.get(type);
    if (!limit) throw new Error(`No limit set for type ${type}`);
    const lastRequest = this._lastRequest.get(type) || 0;
    return Date.now() - lastRequest < limit;
  }

  private sleep(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export { RateLimiter };
