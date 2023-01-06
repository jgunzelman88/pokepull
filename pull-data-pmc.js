import * as jsdom from 'jsdom'
import * as fs from 'fs'
import Database from 'better-sqlite3'
import fetch from 'node-fetch';

//https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/2?format=unlimited&11tg-swsh=on
const baseURL = "https://www.pokemon.com/us/pokemon-tcg/pokemon-cards/"
const format = "unlimited"

getSeriesExps()

async function getSeriesExps(){
    let response = await fetch(baseURL)
    let data = await response.text()
    const { window } = new jsdom.JSDOM(data)
    const series_search = window.document.getElementById("filterExpansions")
    const series_tag = series_search?.getElementsByTagName("fieldset")[0];

    if(series_tag != null){
        let latest_series = series_tag.getElementsByTagName("h2")[0].textContent
        console.log(latest_series)
        let exps_tags = series_tag.getElementsByTagName("li")
        let exps = []
        for (let i = 0; i < exps_tags.length; i++){
            let exp_tag = exps_tags[i];
            let code = exp_tag.getElementsByTagName("input")[0].id
            let name = exp_tag.getElementsByTagName("span")[0].textContent
            exps.push({name: name, pmc_code: code});
        }
    }
}

async function downloadLatestDB(){
    
}

