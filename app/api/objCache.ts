import { kv } from "@vercel/kv";

const EXPIRE_TIME = 3600 * 24 * 7;

class ObjCache {
  async get(key: string) {
    if (!key) {
      throw new Error("Get key is lost");
    }
    return kv.hgetall(key);
  }
  async set(key: string, value: any, opt: any) {
    if (!key) {
      throw new Error("Set key is lost");
    }
    if (typeof value !== "object") {
      throw new Error("Set value must be an object type");
    }
    return kv.hset(key, value);
  }
}

const cache = new ObjCache();

export default cache;
