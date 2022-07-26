import { parse } from 'ts-command-line-args';
import * as fs from "fs"
import { Card } from "./model/Card"
import { upsertCard } from "./utils/Datastore"

interface IPokePullArgs {
    auth?: string
    pull?: boolean
    upsertCard?: string
    upsertCards?: string
    upsertSet?: string
}

export const args = parse<IPokePullArgs>({
    auth: { type: String, optional: true, description: "gcp auth json file" },
    pull: { type: Boolean, alias: 'p', optional: true, description: "Pull latest data from sources" },
    upsertCard: { type: String, optional: true, description: "Upsert data from provided json file" },
    upsertCards: { type: String, optional: true, description: "Upsert data from provided json file" },
    upsertSet: { type: String, optional: true, description: "Upsert data from provided json file" },
})

let auth: string

if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    if (args.auth) {
        auth = args.auth
    } else {
        auth = process.env.GOOGLE_APPLICATION_CREDENTIALS
    }
} else {
    if (args.auth) {
        auth = args.auth
    } else {
        console.log("GOOGLE_APPLICATION_CREDENTIALS not set and no auth file provided :(")
        process.exit(1)
    }
}

/////////////////////////////////////
//Parse Arguments                  //
/////////////////////////////////////

if (args.pull) {
    //blam
} else if (args.upsertCard) {
    let card = JSON.parse(fs.readFileSync(args.upsertCard).toString()) as Card
    upsertCard(card)
} else {
    //start web server
}