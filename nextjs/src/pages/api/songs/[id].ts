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
import Records from 'db/model/records'
import e from 'cors'
import { reEscape } from 'utils/calculateRating'
import CryptoJS from 'crypto-js'
import { decrypt } from 'utils/encrypt'
import { ChunithmNetRecord, Difficulty, RecordType } from 'types'
// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
    methods: ['PUT'],
    origin: 'https://chunithm-net-eng.com',
})

async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Songs>
) {
    await runMiddleware(req, res, cors)
    let song = await Songs.findOne({ where: { id: req.query.id } })
    if (song)
        res.status(200).json(song)
    else throw new BadRequestError("no this song")
}

export default withErrorHandler(handler)