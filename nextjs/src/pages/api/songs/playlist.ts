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
// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
    methods: ['GET'],
    origin: 'https://chunithm-net-eng.com',
})
type Response = Pick<Songs, "display_name" | "youtube_link">
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Response[] | null>
) {
    await runMiddleware(req, res, cors)
    let songs: Response[] = []
    const playlistID = req.query.id
    let nextPageToken: string | null = ""
    let x = 0
    while (true) {
        let searchKey = `?part=snippet&key=${process.env.YOUTUBE_API_KEY}&playlistId=${playlistID}&maxResults=50`
        if (nextPageToken) {
            searchKey += `&pageToken=${nextPageToken}`
        }
        let url = encodeURI(`https://www.googleapis.com/youtube/v3/playlistItems${searchKey}`)
        console.log(url)
        try {
            let youtubeAPIResult = await axios.get(url)
            nextPageToken = youtubeAPIResult.data.nextPageToken

            let filteredItem = _.filter(youtubeAPIResult.data.items, k => k.snippet.title != "Deleted video")
            let result = _.map<any, Response>(filteredItem, k => {
                return {
                    display_name: k.snippet.title,
                    youtube_link: k.snippet.resourceId.videoId
                }
            })
            songs = songs.concat(result)
            x++
            if (!nextPageToken || songs.length >= youtubeAPIResult.data.pageInfo.totalResults) {
                break
            }
        } catch (e) {
            console.info("cannot get the full list, youtube api error", e)
            break
        }
    }


    res.status(200).json(songs)
}

export default withErrorHandler(handler)