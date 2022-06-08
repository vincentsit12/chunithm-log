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
    res: NextApiResponse<string>
) {
    await runMiddleware(req, res, cors)
    if (req.method === 'PUT') {
        if (!req.body.user_id)
            throw new BadRequestError('no user provided')
        console.table(req.body.data);

        await Records.destroy({ where: { user_id: req.body.user_id }, force: true })
        await Records.bulkCreate(req.body.data)


        res.status(200).send('update success')
    }
    else throw new BadRequestError(`do not accept ${req.method} `)


}

export default withErrorHandler(handler)