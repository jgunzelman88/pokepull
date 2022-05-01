import sqlite3 from 'sqlite3'
import * as fs from 'fs'

console.log('Post Processing')

const db = new sqlite3.Database('./dist/data.sqlite3', sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
    if (err) console.error('Database opening error: ', err);
});

start()

async function start(){
    await fixSetNumbers()
}

async function fixSetNumbers(){
    let ingoreSets = ['Celebrations']
    let sqlSets = JSON.stringify(ingoreSets).replace("[", "(").replace("]", ")")
    let records = await dbSelect(`SELECT * FROM cards WHERE expName NOT IN ${sqlSets}`)
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
        await dbRun(`UPDATE cards SET expCardNumber = $expCardNumber WHERE cardId = $cardId`, {'$expCardNumber': card.expCardNumber, '$cardId' : card.cardId})
    }
}

export function dbRun(statement, args) {
    return new Promise((resolve, reject) => {
        db.run(statement, args, (err) => {
            if (err) {
                console.error(statement + ":" + args + ":" + err)
                reject()
            }
            resolve()
        })
    })
}

export function dbSelect(statement, args) {
    return new Promise((resolve, reject) => {
        const rows = [];
        db.each(statement, args, (err, row) => {
            if (err) {
                reject(err);
            }
            rows.push(row);
        }, (err, _) => {
            if (err) {
                reject(err)
            } else {
                resolve(rows)
            }
        });
    });
}