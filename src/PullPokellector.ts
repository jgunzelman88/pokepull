import XMLHttpRequest from 'xhr2';
import { LowSync, JSONFileSync } from 'lowdb'
import * as JSDOM from 'jsdom'
import { Expansion, Series, MetaData } from "./model/Meta"
import { Card } from "./model/Card"
import { timer } from "rxjs"
import exp from 'constants';

const metaAdapter = new JSONFileSync<MetaData>("./data/meta.json")
const metaDB = new LowSync<MetaData>(metaAdapter)
metaDB.read()
metaDB.data ||= new MetaData()

const adapter = new JSONFileSync<Array<Card>>("./data/cards.json")
const cardDB = new LowSync(adapter)
cardDB.read()
cardDB.data ||= new Array<Card>()
checkForSets()

let addExpantions = new Array<Expansion>()

export function checkForSets() {
    const request = new XMLHttpRequest();
    request.open("GET", `https://www.pokellector.com/sets`)
    request.send()
    request.onreadystatechange = () => {
        if (request.readyState === XMLHttpRequest.DONE) {
            const { window } = new JSDOM(request.responseText)
            const left = window.document.getElementById("columnLeft")
            const seriesName = left.document.getElementsByTagName("h1")
            const seriesExp = left.document.getElementsByClassName("buttonlisting")
            //cycle though series
            for (let i = 0; i < seriesName.length; i++) {
                let series_name = seriesName[i].replaceAll("Series", "").trim()
                let series = metaDB.data?.series.find(({ name }) => name === series_name)
                //create new series not found
                if (series == null) {
                    let series = new Series(series_name)
                    metaDB.data?.series.push(series)
                }
                //cycle though expansions looking for new ones
                const expButtons = seriesExp[i].getElementsByClassName("button")

                for (let button of expButtons) {
                    let expName = button.getElementsByTagName("span")[0].textContent.trim()
                    let expFound = metaDB.data?.expansions.find(({name}) => name === expName)
                    //search for expantion
                    if(expFound == null){
                        let imgs = button.getElementsByTagName("img")
                        let newExp = new Expansion(expName, imgs[0].src, imgs[1].src)
                        metaDB.data?.expansions.push(newExp)
                        addExpantions.push(newExp)
                    }
                }
            }
            const pullExpThread = timer(2000).subscribe(
                () => {
                    let exp = addExpantions.pop()
                    if(exp != null){
                        pullCards(exp)
                    }else{
                        pullExpThread.unsubscribe()
                    }
                }
            )
            metaDB.write()
        }
    }
    
}

function pullCards(expantion: Expansion) {
    let request = JSON.parse(fs.readFileSync("set-request.json").toString())
    request.filters.term.setName.push(set.id)
    axios.post('https://mpapi.tcgplayer.com/v2/search/request?q=&isList=false', request).then(
        (res) => {
            for (let card of res.data.results[0].results) {
                let name = card.productName;
                cardDB.data?.push(
                    {
                        "id": `${name.replaceAll(" ", "-")}-(${set}-${card.customAttributes.number})`,
                        "name": name,
                        "setId": expantion.name,
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

