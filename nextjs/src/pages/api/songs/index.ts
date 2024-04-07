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
    res: NextApiResponse<Songs[] | null>
) {
    await runMiddleware(req, res, cors)

    let data = await Songs.findAll({
        attributes: ['id', 'display_name', 'master', 'ultima' ,'expert'],
        where: {
            [Op.or]: [{
                "master.rate": { [Op.gte]: 13 },
            }, {
                "ultima.rate": { [Op.gte]: 13 },
            }, {
                "expert.rate": { [Op.gte]: 13 },
            }]
        },
    })
    let obj = _.keyBy(data, function (o) {
        return o.display_name;
    });
    // console.log("🚀 ~ file: hello.ts ~ line 25 ~ data", data)

    res.status(200).json(data)
}

export default withErrorHandler(handler)