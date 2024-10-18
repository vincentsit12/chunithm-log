const puppeteer = require('puppeteer');
const _ = require('lodash')
const $ = require('jquery')
const fs = require('fs')


const getRating = async () => {
    try {
        const links = ['https://wikiwiki.jp/chunithmwiki/CHUNITHM%20LUMINOUS%20PLUS%20%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7%28%E5%AE%9A%E6%95%B0%E9%A0%861%29',
            "https://wikiwiki.jp/chunithmwiki/CHUNITHM%20LUMINOUS%20PLUS%20%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7%28%E5%AE%9A%E6%95%B0%E9%A0%862%29",
            "https://wikiwiki.jp/chunithmwiki/CHUNITHM%20LUMINOUS%20PLUS%20%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7%28%E5%AE%9A%E6%95%B0%E9%A0%863%29"]
        // "https://chunithm.gamerch.com/CHUNITHM%20NEW%20PLUS%20%E6%A5%BD%E6%9B%B2%E4%B8%80%E8%A6%A7%EF%BC%88%E5%AE%9A%E6%95%B0%E9%A0%86%EF%BC%892"]
        // const wsChromeEndpointurl = 'ws://127.0.0.1:9222/devtools/browser/58b05181-1096-470c-b9b9-a8e27578a62c';
        // const browser = await puppeteer.connect({
        //     browserWSEndpoint: wsChromeEndpointurl,
        // });
        // const browser = await puppeteer.launch({
        //     executablePath:
        //         '/Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome',
        //     //   userDataDir : '/Users/yaugor/Library/Application Support/Google/Chrome/',
        //     headless: true // 無外殼的 Chrome，有更佳的效能
        // });
        const browser = await puppeteer.launch(
            {   
                // headless : false,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox'
                ]
            }
        );
        const page = await browser.newPage();

        let ratingObjList = [];
        for (let i = 0; i < links.length; i++) {
            await page.goto(links[i], { waitUntil: 'networkidle2' });
            await page.waitForSelector('#content > div >  table')
            await page.addScriptTag({ path: "jquery-3.5.1.min.js" })



            console.log('scrap...' + i)
            let x = await page.evaluate(() => {
                let list = {}
                const toASCII = (chars) => {
                    let ascii = '';
                    for (let i = 0, l = chars.length; i < l; i++) {
                        let c = chars[i].charCodeAt(0);
                        if (c >= 0xFF00 && c <= 0xFFEF) {
                            c = 0xFF & (c + 0x20);
                        }
                        ascii += String.fromCharCode(c);
                    }
                    return ascii.replace(/[”“]/g, '\"');;
                }

                let table = $('#content > div >  table');


                //first one is excluded
                for (i = 1; i < table.length; i++) {
                    let row = table[i].getElementsByTagName('tr');
                    // ignore thead
                    let index = 1;
                    let rate = 0;
                    let diffculty = 'master';
                    let genre = 'ORI'
                    while (index < row.length) {
                        let _td = $(row[index]).find('td');

                        if (_td.length < 2) {
                            rate = parseFloat(row[index].innerText);
                            index++;
                        }
                        else {
                            let startIndex = 0
                            if (_td.length === 5) {

                                if (_td[0].innerText === "ULT") {
                                    diffculty = 'ultima'
                                }
                                else if (_td[0].innerText === "MAS") {
                                    diffculty = 'master'
                                }
                                else if (_td[0].innerText === "EXP") {
                                    diffculty = 'expert'
                                }
                                else if (_td[0].innerText === "ADV") {
                                    diffculty = 'advanced'
                                }

                                startIndex++
                            }

                            if (diffculty !== "advanced") {
                                //song name will not affect by other col
                                let textEle = $(row[index]).find('td > a')
                                let songName = ""
                                if (textEle.length == 0) {
                                    textEle = $(row[index]).find('td > span')
                                    songName = textEle[0]?.innerText ?? ""
                                    songName = songName.slice(0, -1)
                                }
                                else {
                                    songName = textEle[0]?.innerText ?? ""
                                }

                                if (_td.length > 3) {
                                    genre = _td[startIndex].innerText
                                    startIndex++
                                }

                                //startIndex should be song name, next index will be combo
                                let comboEle = _td[startIndex + 1]
                                let combo = comboEle ? comboEle.innerText : '0'

                                let key
                                if (songName && rate > 0) {
                                    key = toASCII(songName).replace(/[\n\s'’]/g, '')

                                    if (!list[key]) {
                                        list[key] = {
                                            displayName: songName.replace(/[\n]/g, ''),
                                            genre: genre,
                                            [diffculty]: {
                                                rate: rate,
                                                combo: parseInt(combo),
                                                
                                            }
                                        }
                                    }
                                    else {
                                        list[key][diffculty] = {
                                            rate: rate,
                                            combo: parseInt(combo),
                                        }
                                    }
                                }
                                else {

                                    // console.log("🚀 ~ file: scrapper.js:133 ~ x ~ songName:", textEle)
                                }

                            }

                            index++
                        }
                    }
                }

                // console.log(list)
                return list
            })
            ratingObjList.push(x)
            // alert('finish');



        }


        // let list = {};
        // table = _.drop(table)
        // for (var i = 0; i < table.length; i++) {
        //     let row = await table[i].asElement().$$("tr")
        //     let index = 1;
        //     let rate = 0;
        //     let isMaster;
        //     while (index < row.length) {

        //         let _td = await row[index].asElement().$$('td');

        //         if (_td.length < 1) {
        //             let text = await page.evaluate(el => el.innerText, row[index])
        //             rate = parseFloat(text);
        //             isMaster = true;
        //             index++;
        //         }
        //         else {
        //             let className = await page.evaluate(el => { return el.className }, _td[0])

        //             if (!className.includes('no-min-width') && isMaster) {
        //                 let rateEl = await row[index].asElement().$$('td > a')
        //                 let rateText = await page.evaluate(el => { return el.innerText }, rateEl[0])

        //                 list[toASCII(rateText).replace(/[\n\s'’]/g, '')] = {
        //                     master: rate
        //                 }

        //             }
        //             else {
        //                 let text = await page.evaluate(el => el.innerText, _td[0])

        //                 if (text === "EXP")
        //                     isMaster = false
        //             }
        //             index++
        //         }

        //     }
        // }


        await browser.close();

        let ratingList = _.merge(...ratingObjList)
        return ratingList
    }
    catch (e) {
        console.log(e)
        process.exit()

    }
};

// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
const init = async () => {
    let r = await getRating()
    console.log("🚀 ~ file: scrapper.js:185 ~ init ~ r:", r)
    console.log(Object.keys(r).length);
    fs.writeFileSync('test2.json', JSON.stringify(r))
    // Object.keys(r).forEach(k => {
    //     if (r[k].master && r[k].master.rate === 0) {
    //         console.log(r[k])
    //     }
    //     if (r[k].displayName == "ぶいえす!!らいばる!!") {
    //         console.log(r[k])
    //     }
    // })
}

// init()
module.exports = { getRating }






