const https = require('https')
const fs = require('fs')

let sets = JSON.parse(fs.readFileSync("expansions.json"))
let files = fs.readdirSync("./cards")
for (let set of sets) {
    const name = set.name.replaceAll(" ", "-")
    fs.mkdirSync(`./card_images/${name}`)
    files.find((file) => {
        if(file.includes(name)){
            fs.copyFileSync(`./cards/${file}`, `./card_images/${name}/${file}`)
        }

    }
    )
}

/*
let files = process.argv.slice(2)
for (let file of files) {
    let cards = JSON.parse(fs.readFileSync(file))
    for (let card of cards) {
        const output = fs.createWriteStream(`./cards/${card.id.replace(/\/\w+\d+\)/,"").replace("(","")}.jpg`);
        https.get(card.img, function (response) {
            response.pipe(output);
            console.log(card.id)
        });
    }
}*/