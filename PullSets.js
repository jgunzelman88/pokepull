import axios from "axios"
import XMLHttpRequest from 'xhr2';
import fs from 'fs'
import { LowSync, JSONFileSync } from 'lowdb'

import { JSDOM } from 'jsdom'

const metaAdapter = new JSONFileSync("./data/meta.json")
const metaDB = new LowSync(metaAdapter)
metaDB.read()
metaDB.data ||= { sets: [], collections: [] }

const adapter = new JSONFileSync("./data/meta.json")
const cardDB = new LowSync(adapter)
cardDB.read()
cardDB.data ||= { cards: [] }
checkForSets()

export function checkForSets() {
    let request = JSON.parse(fs.readFileSync("set-request.json").toString())
    axios.post('https://mpapi.tcgplayer.com/v2/search/request?q=&isList=false', request).then(
        (res) => {
            let newSets = []
            for (let set of res.data.results[0].aggregations.setName) {
                let found = metaDB.data.sets.find(({ id }) => id === set.urlValue)
                if (found == null) {
                    let newSet = { "id": set.urlValue, "name": set.value, "count": set.count, iconURL: "", symbolURL: "" }
                    newSets.push(newSet)
                    console.log(`found new set: ${set.urlValue}`)
                }
            }
            metaDB.data.sets.push.apply(metaDB.data.sets, newSets)
            const request = new XMLHttpRequest();
            request.open("GET", `https://www.pokellector.com/sets`)
            request.send()
            request.onreadystatechange = () => {
                if (request.readyState === XMLHttpRequest.DONE) {
                    const { window } = new JSDOM(request.responseText)
                    const left = window.document.getElementById("columnLeft")
                    const setButtons = left.getElementsByClassName("button")
                    for (let button of setButtons) {
                        let name = button.getElementsByTagName("span")[0].textContent.trim()

                        let found = metaDB.data.sets.find(({ id }) => id.includes(searchValue) )
                        if (found != null) {
                            let imgs = button.getElementsByTagName("img")
                            found.name = name
                            found.iconUrl = imgs[0].src
                            found.symbolURL = imgs[1].src
                            console.log(`Found Set: ${JSON.stringify(found)}`)
                        }
                    }
                    metaDB.write()
                }
                
            }
        }
    )
}

function pullCards(set) {
    let request = JSON.parse(fs.readFileSync("set-request.json").toString())
    request.filters.term.setName.push(set.id)
    axios.post('https://mpapi.tcgplayer.com/v2/search/request?q=&isList=false', request).then(
        (res) => {
            for (let card of res.data.results[0].results) {
                let name = card.productName;
                metaDB.data?.cards.push(
                    {
                        "id": `${name.replaceAll(" ", "-")}-(${set}-${card.customAttributes.number})`,
                        "name": name,
                        "setId": set.id,
                        "setName": set.name,
                        "setCardNumber": card.customAttributes.number.split("/")[0],
                        "rarity": card.rarityName,
                        "img": `https://tcgplayer-cdn.tcgplayer.com/product/${card.productId.toFixed()}_200w.jpg`,
                        "description": card.customAttributes.description,
                        "releaseDate": card.customAttributes.releaseDate,
                        "stage": card.customAttributes.stage,
                        "energyType": card.customAttributes.energyType,
                        "cardType": card.customAttributes.cardType,
                        "cardTypeB": card.customAttributes.cardTypeB,
                        "resistance": card.customAttributes.resistance,
                        "weakness": card.customAttributes.weakness,
                        "flavorText": card.customAttributes.flavorText,
                        "attack1": card.customAttributes.attack1,
                        "attack2": card.customAttributes.attack2,
                        "attack3": card.customAttributes.attack3,
                        "attack4": card.customAttributes.attack4
                    }
                )
            }
            metaDB.write()
        }
    )
}

