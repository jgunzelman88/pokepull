import Database from 'better-sqlite3'
import * as fs from 'fs'

const db = new Database('./dist/data.sqlite3')

function start() {
    let exps = db.prepare(`select * from expansions`).all()
    let series = db.prepare('select * from series').all()
    fs.writeFileSync(`./dist/exps.json`, JSON.stringify(exps, null, 1))
    fs.writeFileSync(`./dist/series.json`, JSON.stringify(series, null, 1))
    for(let exp of exps){
        let exp_name =  exp.name;
        let cards = db.prepare(`select * from cards where expName = ?`).all(exp_name);
        for(let card of cards){
            let var_str = card.variants
            if(var_str != null)
                card.variants = JSON.parse(var_str)
        }
        fs.writeFileSync(`./dist/cards/${exp_name}.json`, JSON.stringify(cards, null, 1))
    }
}

start()