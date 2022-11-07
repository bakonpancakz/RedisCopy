import { RedisClientType } from "redis";

export interface CollectedKey {
    name: string;
    type: "hash" | "set" | "string" | "list" | string;
    value: any;
}

export const KeyCommands = {
    "hash": {
        get: (keyName: string, db: RedisClientType) => db.hGetAll(keyName),
        set: (key: CollectedKey, db: RedisClientType) => db.hSet(key.name, key.value),
    },
    "set": {
        get: (keyName: string, db: RedisClientType) => db.sMembers(keyName),
        set: (key: CollectedKey, db: RedisClientType) => db.sAdd(key.name, key.value),
    },
    "string": {
        get: (keyName: string, db: RedisClientType) => db.get(keyName),
        set: (key: CollectedKey, db: RedisClientType) => db.set(key.name, key.value),
    },
    "list": {
        get: (keyName: string, db: RedisClientType) => db.lRange(keyName, 0, -1),
        set: (key: CollectedKey, db: RedisClientType) => db.lPush(key.name, key.value),
    }
}