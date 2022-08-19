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
import { Rating, Song } from 'types'
import Records from 'db/model/records'
import { calculateSingleSongRating, toFixedTrunc } from 'utils/calculateRating'
import { UnauthenticatedError } from 'errors/UnauthenticatedError'
import { getSession } from 'next-auth/react'
// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }


async function handler(
    req: NextApiRequest,
    res: NextApiResponse<Rating[] | null>
) {

    if (req.method !== 'GET') throw new BadRequestError(`do not accept ${req.method} `)
    const session = await getSession({ req })
   
    if (!session) throw new UnauthenticatedError('please login first')

    let data: any = (await Users.findOne({ where: { id: req.body.user_id }, include: { model: Records, include: [{ model: Songs }] } }))

    const ratingList = _.map(data.records, function (o) {
        let song: Song = JSON.parse(o.song[o.difficulty])
        let rating = calculateSingleSongRating(song?.rate, o.score)
        let result: Rating = { song: o.song.display_name, combo: song?.combo, internalRate : song?.rate, rating: rating, truncatedRating: toFixedTrunc(rating, 2), score: o.score, difficulty: o.difficulty, }
        return result
    });
    // console.log("🚀 ~ file: hello.ts ~ line 25 ~ data", data)

    res.status(200).json(ratingList)
}

export default withErrorHandler(handler)
