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
    let song_id = Number(req.query.id)
    let song = await Songs.findOne({ where: { id: song_id } })
    let result = ""
    if (song) {
       if (song.youtube_link) {
            res.status(200).json(song.youtube_link)
            return
       }
        try {
            const searchKey = `${process.env.YOUTUBE_API_KEY}&q="${song.display_name}" chunithm 譜面確認`
            let url = encodeURI(`https://www.googleapis.com/youtube/v3/search?key=${searchKey}`)
            let youtubeAPIResult = await axios.get(url)
            result = youtubeAPIResult.data.items[0].id.videoId
            // save to db
            song.youtube_link = result
            song.save()

        } catch (e) {
            try {
                const searchKey = `%27${song.display_name}%27+chunithm+譜面確認`
                console.log("youtube api fail, start to search local")
                let url = encodeURI(`https://www.youtube.com/results?search_query=${searchKey}`)
                let localSearch = await fetch(url)
                let localSearchRes = await localSearch.text()
                var doc = parse(localSearchRes)
                var x = doc.getElementsByTagName("script")
                for (let i = 0; i < x.length; i++) {
                    const element = x[i];
                    if (element.innerHTML.includes("ytInitialData")) {
                        let predictString = element.innerHTML.substring(element.innerHTML.indexOf("videoId"), element.innerHTML.indexOf("thumbnail"))
                        result = predictString.split(`\"`)[2]
                        break
                    }
                }
            } catch (error) {
                throw new BadRequestError("cannot find song")
            }
        }

        if (result) {
            console.log(result)
            res.status(200).json(result)
        }
        else new BadRequestError("cannot get music link")
    }
    else throw new BadRequestError("cannot find song")


}

export default withErrorHandler(handler)