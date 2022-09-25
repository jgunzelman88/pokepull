import { Card } from "../model/Card";
import { Database } from "bun:sqlite";
import { get_access_token } from "./Auth";

const PROJECT = "alpine-air-331321";
const gcpBase = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/`

export function upsertCard(card: Card): Promise<void> {
    return new Promise(
         async (resolve, reject) => {
            let access_token; 
            try{
                access_token = await get_access_token();
            }catch(e){
                reject(e);
            }
            console.debug(`access token: ${access_token}`)
            let gcpPayload = {
                "fields": {
                    "cardId": { "stringValue": card.cardId },
                    "idTCGP": { "integerValue": card.idTCGP },
                    "name": { "stringValue": card.name },
                    "expCodeTCGP": { "stringValue": card.expCodeTCGP },
                    "expName": { "stringValue": card.expName },
                    "expCardNumber": { "stringValue": card.expCardNumber },
                    "rarity": { "stringValue": card.rarity },
                    "variants": { "arrayValue": format_array(card.variants) },
                    "price": { "doubleValue": card.price },
                    "pokedex": { "integerValue": card.pokedex },
                    "releaseDate": { "timestampValue": card.releaseDate },
                    "energyType": { "stringValue": card.energyType },
                    "cardType": { "stringValue": card.cardType },
                    "img": { "stringValue": card.img }
                }
            }
            fetch(`${gcpBase}/cards/${card.cardId}`,
                {
                    method: 'PATCH',
                    body: JSON.stringify(
                        gcpPayload
                    ),
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': access_token
                    }
                })
                .then(_ => resolve())
                .then(e => reject(e))
        }
    )
}

function format_array(ary: string[]): any {
    let vals = { "values": [] };
    for (let str in ary) {
        vals.values.push({ "stringValue": str })
    }
    return vals;
}

