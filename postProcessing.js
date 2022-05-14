import Database from 'better-sqlite3'

const new_variants =
[
    "Normal",
    "Reverse Holofoil",
    "Holofoil"
]

const old_sets =
[
    "Base Set",
    "Jungle",
    "Fossil",
    "Team Rocket",
    "Gym Heroes",
    "Gym Challenge",
    "Neo Genesis",
    "Neo Discovery",
    "Southern Islands",
    "Neo Revelation",
    "Neo Destiny"
]

const old_variants =
[
    "1st Edition",
    "Unlimited",
    "1st Edition Holofoil",
    "Unlimited Holofoil",
]

console.log('Post Processing')

const db = new Database('./dist/data.sqlite3')

start()

async function start(){

     fixSetNumbers()
     console.log(" - Fix set numbers")
     forAll()

}

 function fixSetNumbers(){
    let ingoreSets = ['Celebrations']
    let sqlSets = JSON.stringify(ingoreSets).replace("[", "(").replace("]", ")").replaceAll("\"","\'")
    let records = db.prepare(`SELECT * FROM cards WHERE expName NOT IN ${sqlSets}`).all()
    for(let card of records){
        if(card.expCardNumber.match(/^\d$/)){
            card.expCardNumber = `00${card.expCardNumber}`
        }else if(card.expCardNumber.match(/^\d\d$/)){
            card.expCardNumber = `0${card.expCardNumber}`
        }else if(card.expCardNumber === ''){
            if(card.cardType === 'Energy'){
                card.expCardNumber = 'z-energy'
            }
        }
        db.prepare(`UPDATE cards SET expCardNumber = $expCardNumber WHERE cardId = $cardId`).run({'expCardNumber': card.expCardNumber, 'cardId' : card.cardId})
    }
}

async function forAll(){
    let records = db.prepare(`SELECT * FROM cards`).all()
    for(let record of records){
        let values = {
            'cardId' : record.cardId,
            'variants' : JSON.stringify(getVariants(record)),
        }
        db.prepare(`UPDATE cards SET variants = $variants WHERE cardId = $cardId`).run(values)
    }
}

function getPokedex(card){

}

function getVariants(card){
    let variants = []
    if(card.expName === 'Celebrations'){
        variants = ["Holofoil"]
    }else if(old_sets.indexOf(card.expName) === -1) {
        variants = JSON.parse(JSON.stringify(new_variants))
        if (card.rarity === "Holo Rare") {
            variants.shift()
        } else if (card.rarity === "Common" ||
            card.rarity === "Uncommon" ||
            card.rarity === "Rare"
        ) {
            variants.pop()
        } else if (card.rarity === "Ultra Rare" ||
            card.rarity === "Secret Rare" || 
            card.rarity === "Rare BREAK" ||
            card.rarity === "Prism Rare" ||
            card.rarity === "Amazing Rare" ||
            card.rarity === "Rare Ace"
        ) {
            variants.shift()
            variants.shift()
        }
    } else {
        variants = JSON.parse(JSON.stringify(old_variants)) 
        if(card.expIdTCGP === "Base Set"){
            if(card.rarity === "Holo Rare"){
                variants = ["Holofoil"]
            }else{
                variants = ["Normal"]
            }
        }else{
            if(card.rarity === "Holo Rare"){
                variants.shift()
                variants.shift()
            }else{
                variants.pop()
                variants.pop()
            }
        }
    }
    return variants
}