const { Console } = require('console')
const fs = require('fs')
const INPUT_DIR = "./input"
const OUTPUT_DIR = "./output"

let cards = []
let files = fs.readdirSync(INPUT_DIR)
let set = ""

for (let file of files) {
    let results = JSON.parse(fs.readFileSync(`${INPUT_DIR}/${file}`))
    for (let card of results.results[0].results) {
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
}
fs.writeFileSync(`${OUTPUT_DIR}/${set}.json`, JSON.stringify(cards))