import { Datastore } from "@google-cloud/datastore"
import { CommitResponse } from "@google-cloud/datastore/build/src/request";
import { Card } from "../model/Card";

const datastore = new Datastore({projectId: "alpine-air-331321"});


export function upsertCard(card: Card) : Promise<CommitResponse>{
    const entity = {
            key: "card",
            data: card
    }
    return datastore.save(entity)
}

