const XMLHttpRequest = require('xhr2');
const https = require('https')
const fs = require('fs')

const jsdom = require("jsdom");
let expantions = []
let expantionLogo = []
let expantionSymbols = []

//Pull set names and img srcs
{
    let setUrl = `https://www.pokellector.com/sets`
    const request = new XMLHttpRequest();
    request.open("GET", setUrl)
    request.send()
    request.onreadystatechange = () => {
        if (request.readyState === XMLHttpRequest.DONE) {
            const doc = new jsdom.JSDOM(request.responseText)
            const left = doc.window.document.getElementById("columnLeft")
            const setButtons = left.getElementsByClassName("button")
            for (let button of setButtons) {
                let name = button.getElementsByTagName("span")[0].textContent
                let id = button.getAttribute("href").replace("/sets/", "")
                let expansion = {
                    "name": name,
                    "id": id,
                    "series": ""
                }
                expantions.push(expansion)
                console.log(`Found Set: ${name}`)
                let imgs = button.getElementsByTagName("img")
                expantionLogo.push(imgs[0].src)
                expantionSymbols.push(imgs[1].src)

            }
        }
        fs.writeFile(`./expansions.json`, JSON.stringify(expantions), err => {
            if (err) {
                console.error(err)
            }
        })
        for (let i = 0; i < expantions.length; i++) {
            const logo = fs.createWriteStream(`./set_logos/${expantions[i].id}.png`);
            https.get(expantionLogo[i], function (response) {
                response.pipe(logo);
            });
            const symbol = fs.createWriteStream(`./set_symbols/${expantions[i].id}.png`);
            https.get(expantionSymbols[i], function (response) {
                response.pipe(symbol);
            });
        }
        //Pull cards
        for (let expansion of expantions) {
            let listOfCards = []
            let expansionName = expansion.name.replaceAll(" ", "-")
            console.log(`Getting Cards for : ${expansionName}`)
            let url = `https://www.tcgcollector.com/cards/intl/${expansionName}?displayAs=images&cardsPerPage=120`
            const request = new XMLHttpRequest();
            request.open("GET", url)
            request.send()

            request.onreadystatechange = () => {
                const doc = new jsdom.JSDOM(request.responseText)
                const list = doc.window.document.getElementsByClassName("card-image-grid-item-container")
                for (let card of list) {
                    let id = card.getElementsByClassName("card-image-grid-item-link-title")[0].textContent.replaceAll(" ", "-")
                    let name = id.replace(/\((\w|\s|-|\d|\/)+\)/, "").trim().replaceAll("-", " ")
                    let number = card.getElementsByClassName("card-image-grid-item-link-card-number")[0].textContent.trim().split('/')[0]
                    let rarity = "N/A"
                    let raritySymbol = card.getElementsByClassName("card-rarity-symbol")[0]
                    if (raritySymbol != null)
                        rarity = raritySymbol.getAttribute("title")
                    let img = card.getElementsByTagName("img")[0].getAttribute("src")
                    let cardEntry = {
                        "id": id,
                        "name": name,
                        "set": expansion.id,
                        "setCardNumber": number,
                        "rarity": rarity,
                        "img": img
                    }
                    listOfCards.push(cardEntry)
                    console.log(JSON.stringify(cardEntry))

                    /*const cardImg = fs.createWriteStream(`./cards/${id.replace("/","*")}.png`);
                    https.get(img, function (response) {
                        response.pipe(cardImg);
                    });*/
                }
                if (listOfCards.length != 0) {
                    fs.writeFile(`./sets/${expansionName}.json`, JSON.stringify(listOfCards), err => {
                        if (err) {
                            console.error(err)
                        }
                    })
                }
            }
        }
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
      currentDate = Date.now();
    } while (currentDate - date < milliseconds);
  }