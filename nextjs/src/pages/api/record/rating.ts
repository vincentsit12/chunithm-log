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
import { Rating } from 'types'
import Records from 'db/model/records'
import { calculateSingleSongRating } from 'utils/calculateRating'
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
    const session = await getSession({ req})
    console.log("🚀 ~ file: rating.ts ~ line 29 ~ token", session
    )
    if (!session ) throw new UnauthenticatedError('please login first')
    
    let data: any = (await Users.findOne({ where: { id: req.body.user_id }, include: { model: Records, include: [{ model: Songs }] } }))

    const ratingList = _.map(data.records, function (o) {
        let rate = (Math.trunc(calculateSingleSongRating(o.song[o.difficulty], o.score) * 100) / 100).toFixed(2)
        let result: Rating = { song: o.song.name, rating: rate, score: o.score, difficulty: o.difficulty, }
        return result
    });
    // console.log("🚀 ~ file: hello.ts ~ line 25 ~ data", data)

    res.status(200).json(ratingList)
}

export default withErrorHandler(handler)