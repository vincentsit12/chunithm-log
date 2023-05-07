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
    res: NextApiResponse<_.Dictionary<Songs> | null>
) {
    await runMiddleware(req, res, cors)

    let data = await Songs.findAll({})
    let obj = _.keyBy(data, function (o) {
        return o.name;
    });
    // console.log("🚀 ~ file: hello.ts ~ line 25 ~ data", data)

    res.status(200).json(obj)
}

export default withErrorHandler(handler)