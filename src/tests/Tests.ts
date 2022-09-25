import { upsertCard } from "../utils/Datastore"

async function test_upsert() {
    let test_card = {
        "cardId": "SWSH11-Lost-Origin-Trainer-Gallery-Gengar-TG06",
        "collection": "tes",
        "variant": "Holofoil",
        "paid": 0,
        "count": 1,
        "grade": "",
        "idTCGP": 284266,
        "name": "Gengar",
        "expIdTCGP": "SWSH11 Lost Origin Trainer Gallery",
        "expName": "Lost Origin - Trainer Gallery",
        "expCardNumber": "TG06",
        "expCodeTCGP": "SWSH11: TG",
        "rarity": "Ultra Rare",
        "img": "https://product-images.tcgplayer.com/fit-in/437x437/284266.jpg",
        "price": 4.8,
        "description": "Ability — Netherworld Gate\r\n<br>Once during your turn, if this Pokemon is in your discard pile, you may put it onto your Bench. If you do, put 3 damage counters on this Pokemon.",
        "releaseDate": "2022-09-09T00:00:00Z",
        "energyType": "Psychic",
        "cardType": "Pokemon",
        "pokedex": 94,
        "variants": ["Holofoil"]
    };
    try{
        await upsertCard(test_card);
    }catch(e){
        console.log(e)
    }
}

test_upsert()