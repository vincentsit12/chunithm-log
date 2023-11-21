// @ts-nocheck
// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Songs from 'db/model/songs'
import Users from 'db/model/users'
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'

import _ from 'lodash'
import $ from "jquery";
import { ChunithmNetRecord, Difficulty } from 'types'
import { parse } from 'node-html-parser';
import jsdom from 'jsdom'
import { decrypt } from 'utils/encrypt'
import { getCookie } from 'utils/cookie'
import { htmlDecodeByRegExp, reEscape } from 'utils/calculateRating'
import Records from 'db/model/records'
import { getSession } from 'next-auth/react'
import { getToken } from 'next-auth/jwt'
import axios from 'axios'

// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
    methods: ['POST'],
})

const difficultyList: Difficulty[] = ['ultima', 'master', 'expert']
const CHUNITHM_NET = "https://chunithm-net-eng.com/mobile/home/"

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<string>
) {
    await runMiddleware(req, res, cors)

    let token = await getToken({ req, secret: process.env.JWT_SECRET })
    if (!token) res.status(401).send("please login first")

    const userId = parseInt(decrypt(req.query.id as string))
    if (!userId)
        throw new BadRequestError('no user provided')

    let chunithmNetCookies = ""
    let scoreList: ChunithmNetRecord[] = []

    let aimeUserID: string | undefined = req.body.sid
    let aimeUserPassword: string | undefined = req.body.password
    let user: Users | null = await Users.findOne({ where: { id: userId } })

    if (aimeUserID == undefined || aimeUserPassword == undefined) {
        if (!user || !user.cookies) throw new BadRequestError("require login", 999)
        chunithmNetCookies = user.cookies
        await getRating(CHUNITHM_NET, chunithmNetCookies)
        return
    }


    let formData = new FormData();
    formData.append('retention', String(1));
    formData.append('sid', aimeUserID)
    formData.append('password', aimeUserPassword);

   
    fetch('https://lng-tgk-aime-gw.am-all.net/common_auth/login?site_id=chuniex&redirect_url=https://chunithm-net-eng.com/mobile/&back_url=https://chunithm.sega.com/')
        .then(async function (response) {
            let cookies = response.headers.getSetCookie()
            console.log(cookies[0].split(";")[0])
            fetch("https://lng-tgk-aime-gw.am-all.net/common_auth/login/sid/", {
                headers: {
                    "Cookie": cookies[0],
                },
                method: "POST",
                credentials: "include",
                body: formData,
                redirect: 'manual'
            }).then(function (response) {
                let cookies = response.headers.getSetCookie()
                let location = response.headers.get("location") ?? ""
                console.log("location 1", location, cookies)
                fetch(location, {
                    headers: {
                        "Cookie": cookies.join(";")
                    },
                    redirect: 'manual',
                    credentials: "include",
                }).then(async function (response) {
                    let cookies = response.headers.getSetCookie()
                    let location = response.headers.get("location") ?? ""

                    chunithmNetCookies = cookies.join(";")
                    try {
                        let res = await user?.update({ cookies: chunithmNetCookies })
                        console.log(res)
                    }
                    catch (e) {
                        console.log(e)
                    }

                    console.log("location 2", location, chunithmNetCookies)

                    await getRating(location, chunithmNetCookies)
                })
            })
        }).catch(e => {
            throw new BadRequestError(e.toString())
        })
    async function getRating(location: string, cookies: string) {
        // chunithm-net
        let response = await fetch(location, {
            headers: {
                "Host": "chunithm-net-eng.com",
                "Cookie": cookies
            },
            redirect: 'follow',
            credentials: "include",
        })

        let html = await response.text()

        let cookie = response.headers.getSetCookie()

        console.log("location 3", cookie)


        for (let i = 0; i < difficultyList.length; i++) {
            await getScoreList(difficultyList[i])
        }
        await getRecentRate()

        let songs = await Songs.findAll({})
        let songsObj = _.keyBy(songs, function (o) {
            return o.name;
        });
        const validSongsData = _.filter<ChunithmNetRecord>(scoreList, k => songsObj[reEscape(k.name)] !== undefined)
        let newRecords = _.map(validSongsData, ((k) => {

            return {
                // name: k.name,
                user_id: userId,
                song_id: songsObj[reEscape(k.name)].id,
                // rate: songsObj[reEscape(k.name)][k.difficulty],
                difficulty: k.difficulty,
                score: k.score,
                type: k.type
            } as Records
        }))

        let records = await Records.findAll({ where: { user_id: userId } })
        let recordsGrp = _.groupBy<Records>(records, 'type')

        let updatedRecords: Records[] = []
        let recentCount = 0

        for (let i = 0; i < newRecords.length; i++) {
            if (newRecords[i].type === 'best') {
                let index = _.findIndex(recordsGrp['best'], k => k.song_id === newRecords[i].song_id && k.difficulty === newRecords[i].difficulty)
                if (index >= 0) {
                    newRecords[i].id = recordsGrp['best'][index].id
                    if (newRecords[i].score > recordsGrp['best'][index].score) {
                        updatedRecords.push(newRecords[i])
                    }
                }
                else {
                    updatedRecords.push(newRecords[i])
                }

            }
            else {
                if (recordsGrp['recent'] && (recordsGrp['recent'].length > recentCount)) {
                    newRecords[i].id = recordsGrp['recent'][recentCount].id
                }
                updatedRecords.push(newRecords[i])
                recentCount++
            }
        }

        await Records.bulkCreate(updatedRecords,
            {
                updateOnDuplicate: ['score', 'song_id', 'difficulty', "updatedAt"],
            });

        // await Records.destroy({ where: { user_id: userId }, force: true })
        // await Records.bulkCreate(data)

        res.status(200).send('update success')

    }

    async function getRecentRate() {
        function getDifficulty(value: "4" | "3" | "2"): Difficulty {
            let map = {
                "4": "ultima",
                "3": "master",
                "2": "expert",
            }
            return map[value] as Difficulty
        }
        let formData = new FormData();
        formData.append('token', getCookie(chunithmNetCookies, '_t'));
        const url = 'https://chunithm-net-eng.com/mobile/home/playerData/ratingDetailRecent/'
        return fetch(url, { method: 'POST', headers: { Cookie: chunithmNetCookies }, body: formData })
            .then(function (response) {
                return response.text()
            }).then(function (html) {
                var doc = parse(html)

                const dom = new jsdom.JSDOM(html)
                const $ = require('jquery')(dom.window);

                const musiclist = $(doc).find('.musiclist_box')
                if (musiclist.length <= 0) {
                    throw ('fail, please login and try again');
                }
                else {
                    for (let i = 0; i < musiclist.length; i++) {
                        let difficulty = getDifficulty($(musiclist[i]).find("input").first().attr("value"))
                        let highscore = $(musiclist[i]).find('.play_musicdata_highscore')[0]
                        if (highscore) {
                            let songName = $(musiclist[i]).find('.music_title')[0].innerText
                            let score = $(highscore).find('span')[0].innerText.split(',').join('')

                            if (parseInt(score) >= 0) {
                                scoreList.push({
                                    name: htmlDecodeByRegExp(songName),
                                    difficulty: difficulty,
                                    score: parseInt(score),
                                    type: "recent"
                                })

                            }

                        }
                    }

                }
            }).catch(e => {
                throw e
            });
    }

    async function getScoreList(difficulty: Difficulty) {

        let params = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        let formData = new FormData();
        formData.append('genre', String(99));
        formData.append('token', getCookie(chunithmNetCookies, '_t'));

        const url = 'https://chunithm-net-eng.com/mobile/record/musicGenre/send' + params
        return fetch(url, { method: 'POST', headers: { Cookie: chunithmNetCookies }, body: formData })
            .then(function (response) {
                return response.text()
            }).then(async function (html) {
                var doc = parse(html)

                const dom = new jsdom.JSDOM(html)
                const $ = require('jquery')(dom.window);

                const musiclist = $(doc).find('.musiclist_box')

                if (musiclist.length <= 0) {
                    try {
                        let res = await user?.update({ cookies: undefined })
                    }
                    catch (e) {
                        console.log(e)
                    }
                    throw new BadRequestError("cannot get music list", 999)
                }
                else {


                    for (let i = 0; i < musiclist.length; i++) {
                        let highscore = $(musiclist[i]).find('.play_musicdata_highscore')[0]

                        // musiclist[i].getElementsByClassName('play_musicdata_highscore')[0]
                        if (highscore) {
                            let songName = $(musiclist[i]).find('.music_title')[0].innerText
                            let score = $(highscore).find('span')[0].innerText.split(',').join('')
                            // let rate = calculateSingleSongRating(songName, score);

                            if (parseInt(score) >= 0) {
                                // if (songs[reEscape(songName)][difficulty]) {
                                scoreList.push({
                                    name: htmlDecodeByRegExp(songName),
                                    // user_id: userID,
                                    // song_id: songs[reEscape(songName)].id,
                                    // rate: songs[reEscape(songName)][difficulty],
                                    difficulty: difficulty,
                                    score: parseInt(score),
                                    type: "best"
                                })
                                // }
                            }

                        }
                    }

                }
            }).catch(e => {
                throw e
            });
    }


}

export default withErrorHandler(handler)