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

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<string | null>
) {
    await runMiddleware(req, res, cors)
    let song_id = Number(req.query.id)
    let song = await Songs.findOne({ where: { id: song_id } })
    if (song) {
        let url = encodeURI(`https://www.googleapis.com/youtube/v3/search?key=${process.env.YOUTUBE_API_KEY}&q="${song.display_name}" chunithm 譜面確認`)
        console.log(encodeURI(url))
        let youtubeAPIResult = await axios.get(url)
        
        res.status(200).json(youtubeAPIResult.data.items[0].id.videoId)
    }
    else throw new BadRequestError("cannot find song")


}

export default withErrorHandler(handler)