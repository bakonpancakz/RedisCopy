import { createClient } from "redis";
export default function createRedisClient(redisUri: string, dbName: string) {
    // Create new Redis Client
    const newClient = createClient({ url: redisUri });
    newClient.on("error", err => {
        console.error("Redis", err);
        setTimeout(newClient.connect, 1000);
    })
    newClient.once("ready", () => {
        console.log(`${dbName} connected!`)
    })

    // Return Redis Client
    newClient.connect();
    return newClient;
}