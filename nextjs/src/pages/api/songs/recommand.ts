// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Songs from 'db/model/songs'
import Users from 'db/model/users'
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'
import { getToken } from 'next-auth/jwt'
import { Op, Sequelize } from 'sequelize'
import { sequelize } from 'db'

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
    // const token = await getToken({ req, secret: process.env.JWT_SECRET })

    // let data = await Songs.findAll({ order: Sequelize.literal('random()'), limit: 1 })
    if (!req.query.lower && !req.query.lower) {
        throw new BadRequestError("wrong query")
    }
    let lower = parseFloat(req.query.lower as string)
    let upper = parseFloat(req.query.upper as string)
    let data = await Songs.findAll({
        where: {
            [Op.or]: [
                {
                    master: {
                        rate: {
                            [Op.between]: [lower, upper],
                        }
                    }
                },
                {
                    ultima: {
                        rate: {
                            [Op.between]: [lower, upper],
                        }
                    },
                },
                {
                    expert: {
                        rate: {
                            [Op.between]: [lower, upper],
                        }
                    }
                },
            ],
        },
        order: sequelize.random(),
        limit: 10,
    });

    if (!data) {
        throw new BadRequestError('no this song')
    }
    console.table(data)
    res.status(200).send(data)
}

export default withErrorHandler(handler)