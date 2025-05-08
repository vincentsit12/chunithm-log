const puppeteer = require('puppeteer');
const _ = require('lodash')
const $ = require('jquery')
const fs = require('fs')


const getGameScript = async () => {
    try {
        const links =
            [
                "https://sdvx.in/chunithm/sort/10.htm",
                "https://sdvx.in/chunithm/sort/10+.htm",
                "https://sdvx.in/chunithm/sort/11.htm",
                "https://sdvx.in/chunithm/sort/11+.htm",
                "https://sdvx.in/chunithm/sort/12.htm",
                "https://sdvx.in/chunithm/sort/12+.htm",
                "https://sdvx.in/chunithm/sort/13.htm",
                "https://sdvx.in/chunithm/sort/13+.htm",
                "https://sdvx.in/chunithm/sort/14.htm",
                "https://sdvx.in/chunithm/sort/14+.htm",
                "https://sdvx.in/chunithm/sort/15.htm",
                "https://sdvx.in/chunithm/sort/15+.htm"
            ]


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

        let scriptsUrls = [];

        for (let i = 0; i < links.length; i++) {
            await page.goto(links[i], { waitUntil: 'networkidle2' });
            await page.waitForSelector("body > center > table:nth-child(6) > tbody > tr:nth-child(2) > td.tbg > table")
            await page.addScriptTag({ path: "jquery-3.5.1.min.js" })


            console.log('scrap...' + i)
            let x = await page.evaluate(() => {
                const diffcultyMapping = {
                    "mst": "master",
                    "ult": "ultima",
                    "exp": "expert",
                }
                const versionMapping = {
                    '/chunithm/chfiles/chverselogo.png': 'Verse',
                    '/chunithm/chfiles/chluminous+logo.png': 'Luminous Plus',
                    '/chunithm/chfiles/chluminouslogo.png': 'Luminous',
                    '/chunithm/chfiles/chsun+logo.png': 'Sun Plus',
                    '/chunithm/chfiles/chsunlogo.png': 'Sun',
                    '/chunithm/chfiles/chnew+logo.png': 'New Plus',
                    '/chunithm/chfiles/chnewlogo.png': 'New',
                    '/chunithm/chfiles/chparadiselostlogo.png': 'Paradise Lost',
                    '/chunithm/chfiles/chparadiselogo.png': 'Paradise',
                    '/chunithm/chfiles/chcrystal+logo.png': 'Crystal Plus',
                    '/chunithm/chfiles/chcrystallogo.png': 'Crystal',
                    '/chunithm/chfiles/chama+logo.png': 'Amazon Plus',
                    '/chunithm/chfiles/chamalogo.png': 'Amazon',
                    '/chunithm/chfiles/chstar+logo.png': 'Star Plus',
                    '/chunithm/chfiles/chstarlogo.png': 'Star',
                    '/chunithm/chfiles/chair+logo.png': 'Air Plus',
                    '/chunithm/chfiles/chairlogo.png': 'Air',
                    '/chunithm/chfiles/ch+logo.png': 'Chunithm Plus',
                    '/chunithm/chfiles/chlogo.png': 'Chunithm'
                };

                let list = {};
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

                let songs = $("body > center > table:nth-child(6) > tbody > tr:nth-child(2) > td.tbg > table").find("tr");
                let version = null


                //first one is excluded
                for (i = 0; i < songs.length; i++) {
                    if (songs[i].childElementCount <= 1) {
                        version = $(songs[i]).find("center > img").attr("src") ?? version
                    } else {
                        let script = $(songs[i]).find('a')[0]?.href;
                        let name = $(songs[i]).find("td:nth-child(2)")[0]?.innerText;

                        if (!script || !name) continue;
                        let diffculty = diffcultyMapping[script.split("/").at(-1).split(".")[0].slice(-3)]

                        if (diffculty) {
                            if (!list[name]) {
                                list[name] = {
                                    name: toASCII(name).replace(/[\n\s'’]/g, ''),
                                    [diffculty]: {
                                        script: script,
                                        version: versionMapping[version]
                                    }

                                }
                            }
                            else {
                                list[name][diffculty] = script
                            }
                        }
                    }
                }

                return list
            })
            scriptsUrls.push(x)
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
        // console.log(_.merge(...scriptsUrls))
        return _.merge(...scriptsUrls)
    }
    catch (e) {
        console.log(e)
        process.exit()

    }
};

// /Applications/Google\ Chrome.app/Contents/MacOS/Google\ Chrome --remote-debugging-port=9222 --no-first-run --no-default-browser-check --user-data-dir=$(mktemp -d -t 'chrome-remote_data_dir')
const init = async () => {
    let r = await getGameScript()
    // console.table(r)
    fs.writeFileSync('test3.json', JSON.stringify(r))
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
module.exports = { getGameScript }






