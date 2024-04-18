// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Songs from 'db/model/songs'
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
    res: NextApiResponse<string | null>
) {
    await runMiddleware(req, res, cors)
    let song: Songs | null = null
    let song_id = req.query.id
    const gameType = req.query.type
    if (gameType == 'chunithm')
        song = await Songs.findOne({ where: { id: Number(song_id) } })
    let result = ""

    if (song?.youtube_link) {
        res.status(200).json(song.youtube_link)
        return
    }
    const query = song ? song.display_name : song_id
    const subphase = gameType == 'chunithm' ? "譜面確認" : "外部出力"
    try {
        const searchKey = `?key=${process.env.YOUTUBE_API_KEY}&q="${query}" ${gameType} ${subphase}`
        let url = encodeURI(`https://www.googleapis.com/youtube/v3/search${searchKey}`)
        let youtubeAPIResult = await axios.get(url)
        result = youtubeAPIResult.data.items[0].id.videoId
        // save to db
        if (song) {
            song.youtube_link = result
            song.save()
        }

    } catch (e) {
        try {
            const searchKey = `%27${query}%27+${gameType}+${subphase}`
            console.info("youtube api fail, start to search local")
            let url = encodeURI(`https://www.youtube.com/results?search_query=${searchKey}`)
            let localSearch = await fetch(url)
            let localSearchRes = await localSearch.text()
            console.info("get youtube page success")
            var doc = parse(localSearchRes)
            console.info("parse doc success")
            var x = doc.getElementsByTagName("script")
            console.info("get script success", x.length)
            for (let i = 0; i < x.length; i++) {
                const element = x[i];
                if (element.innerHTML.includes("ytInitialData")) {
                    console.info("get ytInitialData success")
                    let predictString = element.innerHTML.substring(element.innerHTML.indexOf("videoId"), element.innerHTML.indexOf("thumbnail"))
                    console.info("get predictString success")
                    result = predictString.split(`\"`)[2]
                    break
                }
            }
        } catch (error) {
            throw error
        }
    }

    if (result) {
        console.log(result)
        res.status(200).json(result)
    }
    else new BadRequestError("cannot get music link")


}

export default withErrorHandler(handler)