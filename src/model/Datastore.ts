import { Datastore } from "@google-cloud/datastore"
import { Card } from "./Card";

const datastore = new Datastore({projectId: "alpine-air-331321"});


export function upsertCard(card: Card) {
    const entity = {
            key: "card",
            data: card
    }

}