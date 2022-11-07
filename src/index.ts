import createRedisClient from "./functions/createRedisClient"
import { KeyCommands, CollectedKey } from "./functions/KeyCommands"
import * as dotenv from "dotenv"

if (dotenv.config().parsed) console.debug("[ENV] Loaded Environment Variables")
const sourceDB = createRedisClient(String(process.env.REDIS_URI_SOURCE), "SourceDB")
const targetDB = createRedisClient(String(process.env.REDIS_URI_TARGET), "TargetDB")


// Wait for Databases to get ready
sourceDB.on("ready", async () => {

    // Retrieve list of Database Items
    const ListOfKeys = await sourceDB.keys("*")
    console.log(`[1/3] Found ${ListOfKeys.length} Key(s) in Source DB`)
    console.log(`[2/3] Collecting Key(s), please wait...`)

    // Get Key Information
    const TypesOf: { [key: string]: number } = {}
    const CollectedKeys = await Promise.all(
        ListOfKeys.map(async (keyName): Promise<CollectedKey> => new Promise(async (resolve, reject) => {
            // Store Key Types
            const keyType = await sourceDB.type(keyName)
            if (!TypesOf[keyType]) TypesOf[keyType] = 0
            TypesOf[keyType]++

            // Retrieve Key Data
            const command = KeyCommands[keyType];
            if (!command) {
                console.error(`[COLLECTOR] Unable to collect '${keyName}', unsupported type of '${keyType}'!`)
                reject("Unsupported Key Type")
            }

            // Return Key Value
            resolve({
                "name": keyName,
                "type": keyType,
                "value": await command.get(keyName, sourceDB),
            })
        }))
    )

    // Second Step Completed
    let msg = `[2/3] Collected Key(s)`
    Object.entries(TypesOf).forEach(([t, n]) => msg += `, ${t}(s): ${n}`)
    console.log(msg)

    // Upload all keys
    console.log("[3/3] Uploading Key(s), please wait...")
    await Promise.all(
        CollectedKeys.map(async (key): Promise<void> => new Promise(async (resolve, reject) => {
            KeyCommands[key.type].set(key, targetDB)
            resolve()
        }))
    )
    // Application Complete
    console.log("[3/3] Upload Complete!")
})