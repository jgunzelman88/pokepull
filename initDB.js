import * as jsdom from 'jsdom'
import axios from 'axios'
import Database from 'better-sqlite3'
import * as fs from 'fs'

export const cardCreateDb =
    `CREATE TABLE IF NOT EXISTS cards (
        cardId TEXT UNIQUE,
        idTCGP INTEGER NULL,
        name TEXT,
        expIdTCGP TEXT NULL,
        expName TEXT,
        expCardNumber TEXT,
        rarity TEXT,
        img TEXT,
        price FLOAT,
        description TEXT NULL,
        releaseDate TEXT NULL,
        energyType TEXT NULL,
        cardType TEXT NULL,
        pokedex INTEGER NULL,
        variants TEXT NULL
        );`

export const expansionCreateDb =
    `CREATE TABLE IF NOT EXISTS expansions (
        name TEXT UNIQUE,
        series TEXT,
        tcgName TEXT,
        pokellectorSet TEXT,
        numberOfCards INTEGER,
        logoURL TEXT,
        symbolURL TEXT,
        releaseDate TEXT
        );`

export const seriesCreateDb =
    `CREATE TABLE IF NOT EXISTS series (
        name TEXT UNIQUE,
        icon TEXT,
        releaseDate TEXT
        );`

export const pokedexCreateDb =
    `CREATE TABLE IF NOT EXISTS pokedex (
        id INTEGER,
        name TEXT,
        img TEXT
        );`

export const addExpSql =
    "INSERT INTO expansions (name, series, tcgName, pokellectorSet, numberOfCards, logoURL, symbolURL) " +
    "VALUES ($name, $series, $tcgName, $pokellectorSet, $numberOfCards, $logoURL, $symbolURL)";

export const addCardSql =
    "INSERT INTO cards (cardId, idTCGP, name, expIdTCGP, expName, expCardNumber, rarity, img, price, description, releaseDate, energyType, cardType) " +
    "VALUES ($cardId, $idTCGP, $name, $expIdTCGP, $expName, $expCardNumber, $rarity, $img, $price, $description, $releaseDate, $energyType, $cardType);"

export const addSeriesSql =
    "INSERT INTO series (name, icon, releaseDate) " +
    "VALUES ($name, $icon, $releaseDate);"

export const addPokedex =
    `INSERT INTO pokedex (id, name, img)
    VALUEs ($id, $name, $img)`

const tcgRequest = `{
    "algorithm": "",
    "from": 0,
    "size": 350,
    "filters": {
        "term": {
            "productLineName": [
                "pokemon"
            ],
            "setName": [
            ],
            "productTypeName": [
                "Cards"
            ]
        },
        "range": {},
        "match": {}
    },
    "listingSearch": {
        "filters": {
            "term": {},
            "range": {
                "quantity": {
                    "gte": 1
                }
            },
            "exclude": {
                "channelExclusion": 0
            }
        },
        "context": {
            "cart": {}
        }
    },
    "context": {
        "cart": {},
        "shippingCountry": "US"
    },
    "sort": {}
}`

let tcgPlayerSets = []
let missingData = JSON.parse(fs.readFileSync("./missingdata.json").toString())

if (fs.existsSync("./dist") === false) {
    fs.mkdirSync("dist")
}

if (fs.existsSync("./dist/data.sqlite3")) {
    fs.rmSync("./dist/data.sqlite3")
}

const db = new Database('./dist/data.sqlite3')

start()

async function start() {
    console.log("Add Tables")
    createTables()
    console.log("Meta Data")
    await getPokedex()
    await getTCGPmetaData()
    fs.writeFileSync("./dist/tcgSets.json", JSON.stringify(tcgPlayerSets, null,1))
    console.log("Pull Sets")
    await getPokellectorSeries()
    console.log("Closing database")
    db.close()
}

function createTables() {
    db.prepare(cardCreateDb).run()
    console.log(" - Create Card Table")
    db.prepare(expansionCreateDb).run()
    console.log(" - Create Expansion Table")
    db.prepare(seriesCreateDb).run()
    console.log(" - Create Series Table")
    db.prepare(pokedexCreateDb).run()
}

async function getTCGPmetaData() {
    let requestTcgSets = JSON.parse(tcgRequest)
    return axios.post(`https://mpapi.tcgplayer.com/v2/search/request?q=&isList=false`, requestTcgSets).then((res) => {
        console.log(res.data.results[0].aggregations.rarityName.map((rare) => rare.value))
        console.log(res.data.results[0].aggregations.cardType.map((type) => type.value))
        res.data.results[0].aggregations.setName.forEach(
            (element) => {
                tcgPlayerSets.push(element.urlValue)
            }
        )
    })
}

/**
 * Checks for new sets will not overwrite old ones will only add new sets
 */
async function getPokellectorSeries() {
    //scrap series from pokellector
    let res = await axios.get(`https://www.pokellector.com/sets`);
    const { window } = new jsdom.JSDOM(res.data)
    const left = window.document.getElementById("columnLeft")
    const seriesName = left?.getElementsByTagName("h1")
    const seriesExp = left?.getElementsByClassName("buttonlisting")
    //cycle though series
    if (seriesName != null) {
        for (let i = 0; i < seriesName.length; i++) {
            let series_name = seriesName[i].textContent?.replaceAll("Series", "").trim() || "n/a"
            let series_icon = seriesName[i].getElementsByTagName("img")[0].src
            //create new series not found
            let series = { name: series_name, icon: series_icon, releaseDate: "" }
            let foundSeries = db.prepare(`SELECT * FROM series WHERE name = $name`).all({ 'name': series_name })
            if (foundSeries.length == 0) {
                db.prepare(addSeriesSql).run(series)
            }
            //cycle though expansions looking for new ones
            if (seriesExp != null) {
                const expButtons = seriesExp[i].getElementsByClassName("button")
                if (expButtons != null) {
                    for (let button of expButtons) {
                        let span = button.getElementsByTagName("span")[0]
                        let expName = span?.textContent?.trim()
                        let imgs = button.getElementsByTagName("img")
                        let exp = {
                            name: expName,
                            series: series_name,
                            tcgName: findTcgSetName(expName, series_name, tcgPlayerSets),
                            pokellectorSet: `https://www.pokellector.com${button.href}`,
                            numberOfCards: 0,
                            logoURL: imgs[0].src,
                            symbolURL: imgs[1].src
                        }
                        db.prepare(addExpSql).run(exp)
                        console.log(`Pulling ${exp.name} `)
                        console.log(` - TCGP ${exp.tcgName}`)
                        if (exp.tcgName === "[\"N/A\"]") {
                            pullCardsPokellecotor(exp)
                        } else {
                            await pullCardsTCGP(exp)
                        }

                    }
                }
            }
        }
    }
}

//Pull cards from pokellector
function pullCardsPokellecotor(expantion) {
    /*let res = await axios.get(expantion.pokellectorSet);
    const { window } = new jsdom.JSDOM(res.data)
    let rows = window.document.getElementsByClassName("card")
    for(let i = 0; i<rows.length; i+=2){
        let plaque = rows[i].getElementsByClassName("plaque")[0].textContent
        let img = rows[i+1].getElementsByTagName("img")[0].src
        let cardNum = plaque.split("-")[0].replace("#", "").trim()
        let name = plaque.split("-")[1].trim()

        let newCard = {
            "cardId": `${expantion.name.replaceAll(" ", "-")}-${name.replaceAll(" ", "-")}-${cardNum}`,
            "idTCGP": -1,
            "name": name,
            "expIdTCGP": card.setUrlName,
            "expName": expantion.name,
            "expCardNumber": cardNum,
            "rarity": card.rarityName,
            "img": img,
            "description": card.customAttributes.description,
            "releaseDate": card.customAttributes.releaseDate,
            "energyType": card.customAttributes.energyType[0] ?? "",
            "cardType": card.customAttributes.cardType[0] ?? "",
        }
    }*/
}

//Pull cards from tcg player
async function pullCardsTCGP(expantion) {
    let request = JSON.parse(tcgRequest)
    request.filters.term.setName = JSON.parse(expantion.tcgName)
    let res = await axios.post(`https://mpapi.tcgplayer.com/v2/search/request?q=&isList=false`, request)
    let count = 0
    let releaseDate
    for (let card of res.data.results[0].results) {
        let name = card.productName;
        releaseDate = releaseDate == null ? card.customAttributes.releaseDate : releaseDate
        if (name.includes("Code Card") === false) {
            let cardNum = card.customAttributes.number.split("/")[0]
            let newCard = {
                "cardId": `${card.setUrlName.replaceAll(" ", "-")}-${name.replaceAll(" ", "-")}-${cardNum}`,
                "idTCGP": `${card.productId}${card.setUrlName === "Base Set (Shadowless)" ? " (Shadowless)": ""}`,
                "name": name,
                "expIdTCGP": card.setUrlName,
                "expName": expantion.name,
                "expCardNumber": cardNum,
                "rarity": card.rarityName,
                "img": `https://product-images.tcgplayer.com/fit-in/437x437/${card.productId.toFixed()}.jpg`,
                "price": card.lowestPrice,
                "description": card.customAttributes.description,
                "releaseDate": card.customAttributes.releaseDate,
                "energyType": card.customAttributes.energyType[0] ?? "",
                "cardType": card.customAttributes.cardType[0] ?? "",
            }
            try {
                db.prepare(addCardSql).run(newCard)
            } catch (err) {
                console.log(err)
                console.log(JSON.stringify(newCard,null,1))
            }
            count++
        }
    }
    let relDateExp = releaseDate
    let relSeries = releaseDate
    if (relDateExp == null) {
        let date = new Date(missingData.expRelDates.find((value) => value.name === expantion.name).releaseDate)
        relDateExp = date.toISOString()
    }
    if (relSeries == null) {
        let date = new Date(missingData.seriesRelDate.find((value) => value.name === expantion.series).releaseDate)
        relSeries = date.toISOString()
    }
    try {
        db.prepare("UPDATE series SET releaseDate = $releaseDate WHERE name = $name").run({ "releaseDate": relSeries, "name": expantion.series })
        db.prepare("UPDATE expansions SET releaseDate = $releaseDate, numberOfCards = $numberOfCards WHERE name = $name").run({ "releaseDate": relDateExp, "name": expantion.name, "numberOfCards": count })
    } catch (err) {
        console.log(err)
    }
    console.log(`Added ${count} ${expantion.name} cards`)
}

function findTcgSetName(expName, series, tcgSets) {
    let expNameNorm = (series === expName) ? normalizePOKE(expName) + "baseset" : normalizePOKE(expName)
    let name = searchNameMap(expName)

    if (name.length == 0) {
        name = tcgSets.filter((value) => normalizeTCG(value).includes(expNameNorm))
    }
    if (name.length == 0) {
        name = tcgSets.filter((value) => expNameNorm.includes(normalizeTCG(value)))
    }
    return (name != null && name.length != 0) ? JSON.stringify(name) : "[\"N/A\"]"
}

function searchNameMap(name) {
    let newName = missingData.tcgNameMap.find((value) => value.name === name)
    return newName != null ? newName.tcgName : []
}

async function getPokedex() {
    console.log(" - Pulling pokedex")
    let res = await axios.get(`https://pokemondb.net/pokedex/national`);
    const { window } = new jsdom.JSDOM(res.data)
    let rows = window.document.getElementsByClassName("infocard")
    for(let row of rows){
        let number = Number.parseInt(row.getElementsByTagName("small")[0].textContent.replace("#", ""))
        let img = row.getElementsByClassName("img-sprite")[0].src
        let name = row.getElementsByClassName('ent-name')[0].textContent
        db.prepare(addPokedex).run({name: name, id: number, img: img})
    }
}

function normalizePOKE(name) {
    return name.toLowerCase()
        .replaceAll(' ', '')
        .replaceAll('-', '')
        .replaceAll('&', '')
        .replaceAll(`'`, ``)
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll('and', '')
        .replaceAll(`mcdonaldscollection`, 'mcdonaldspromos')
        .replaceAll('promocards', 'promos')
        .replaceAll('wizardsofthecoast', 'wotc')
        .replaceAll('blackstarpromos', 'promos')
        .replaceAll(`diamondpearl`, `dp`)
        .replaceAll('bestofgame', 'bestof')
}

function normalizeTCG(name) {
    return name.toLowerCase()
        .replaceAll(' ', '')
        .replaceAll('-', '')
        .replaceAll('&', '')
        .replaceAll(`'`, ``)
        .replaceAll('(', '')
        .replaceAll(')', '')
        .replaceAll('and', '')
        .replaceAll('promocards', 'promos')
        .replaceAll('blackstarpromos', 'promos')
        .replaceAll(`diamondpearl`, `dp`)
}