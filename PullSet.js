const axios = require("axios")
const fs = require('fs')
const OUTPUT_DIR = "./data/card_data"

let cards = []
let set = ""
let request = JSON.parse(fs.readFileSync("set-request.json"))
request.filters.term.setName.push(process.argv.splice(2)[0])

axios.post('https://mpapi.tcgplayer.com/v2/search/request?q=&isList=false', request).then(
    (res) =>
    {
        for (let card of res.data.results[0].results) {
            let name = card.productName;
            set = card.setUrlName.replaceAll(" ", "-")
            cards.push(
                {
                    "id": `${name.replaceAll(" ","-")}-(${set}-${card.customAttributes.number})`,
                    "name": name,
                    "setId": set,
                    "setName": card.setName.split(":")[1].trim(),
                    "setCardNumber": card.customAttributes.number.split("/")[0],
                    "rarity": card.rarityName,
                    "img": `https://tcgplayer-cdn.tcgplayer.com/product/${card.productId.toFixed()}_200w.jpg`,
                    "details": card.customAttributes
                }
            )
        }
        fs.writeFileSync(`${OUTPUT_DIR}/${set}.json`, JSON.stringify(cards))
    }
)
