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
import { reEscape } from 'utils/calculateRating'
import { Song } from 'types'
// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
    methods: ['POST'],
    origin: 'https://chuni-log.com',
})
type RequestBody = {
    name: string,
    master? : Song
    expert? : Song
    ultima? : Song
}
async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Songs | null>
) {
    await runMiddleware(req, res, cors)
    let requestBody = req.body as RequestBody
    if (!requestBody.name) { 
        throw new BadRequestError("invalid req")
    }

    try {
        let data = await Songs.findOne({where : {
            name : reEscape(requestBody.name)
        }})
        if (data) {
            throw new BadRequestError("already have this song")
        }
        
        let newSong  = {
            name: reEscape(requestBody.name),
            display_name: requestBody.name,
            master: requestBody.master,
            expert: requestBody.expert,
            ultima : requestBody.ultima,
        }  as Songs
        
        let result = await Songs.create(newSong)

        res.status(200).send(result)
    }
    catch { 
        throw new BadRequestError("")
    }

    // console.log("🚀 ~ file: hello.ts ~ line 25 ~ data", data)

   
}

export default withErrorHandler(handler)