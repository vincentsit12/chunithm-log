// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import { MaimaiSongs } from 'db/model/songs'
import Users from 'db/model/users'
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'
import { getToken } from 'next-auth/jwt'
import _ from 'lodash'
import { Op } from 'sequelize'
import axios from 'axios'
import { parse } from 'node-html-parser';
import jsdom from 'jsdom'
import { MaiMaiDifficulty, MaimaiSongGenre, Song } from 'types'

// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
    methods: ['GET'],
    origin: 'https://chunithm-net-eng.com',
})

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<MaimaiSongs[] | null>
) {
    await runMiddleware(req, res, cors)

    let maimaiSongListHtmlRes = await fetch("https://gamerch.com/maimai/entry/533839")
    // console.log(res)
    let maimaiSongListHtml = await maimaiSongListHtmlRes.text()

    var doc = parse(maimaiSongListHtml)
    const dom = new jsdom.JSDOM(maimaiSongListHtml)

    const $ = require('jquery')(dom.window);
    const toASCII = (chars: string) => {
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
    let table = $('div.main  table');

    let list2: { [name : string]: MaimaiSongs } = {}

    //first one is excluded
    for (let i = 1; i < table.length; i++) {

        let row = $(table[i]).find('tr');

        // ignore thead
        let index = 1;
        let rate = 0;
        let diffculty : MaiMaiDifficulty  = 'master';
        let genre = 'ORI'
        while (index < row.length) {
            let _td = $(row[index]).find('td');

            if (_td.length < 2) {
                rate = parseFloat($(row[index]).text());
                index++;
            }
            else {
                let startIndex = 0
                if (_td.length === 7) {

                    if ($(_td[0]).text() === "Re:M") {
                        diffculty = 'remaster'
                    }
                    else if ($(_td[0]).text() === "MST") {
                        diffculty = 'master'
                    }
                    else if ($(_td[0]).text() === "EXP") {
                        diffculty = 'expert'
                    }
                    else if ($(_td[0]).text() === "ADV") {
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
                        songName = $(textEle[0]).text() ?? ""
                        songName = songName.slice(0, -1)

                    }
                    else {
                        songName = $(textEle[0]).text() ?? ""
                    }
                    if (_td.length > 5) {
                        genre = $(_td[startIndex]).text()
                        startIndex++
                    }

                    //startIndex should be song name, next index will be combo
                    let combo : string  = $(_td[startIndex + 3]).text() ?? ""
                    let artist : string  = $(_td[startIndex + 1]).text() ?? ""
                    let version : string = $(_td[startIndex + 4]).text() ?? ""

                    let key
                    if (songName && rate > 0) {
                        key = toASCII(songName).replace(/[\n\s'’]/g, '')

                        if (!list2[key]) {
                            list2[key] = {
                                name : key,
                                id: Object.keys(list2).length + 1,
                                display_name: songName.replace(/[\n]/g, ''),
                                genre: genre as MaimaiSongGenre,
                                artist: artist,
                                version: version,
                                [diffculty]: {
                                    rate: rate,
                                    combo: parseInt(combo),

                                }
                            }
                        }
                        else {
                            list2[key][diffculty] = {
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
    let newData = _.toPairs(list2).map((k) => {
        return k[1]
    })
    res.json(newData)
}

export default withErrorHandler(handler) 