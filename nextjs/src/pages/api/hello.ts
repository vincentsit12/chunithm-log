// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Songs from 'db/model/songs'
import Users from 'db/model/users'
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'
import { getToken } from 'next-auth/jwt'
import { Sequelize } from 'sequelize'

// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
  methods: ['GET', 'POST'],
  origin: 'https://chunithm-net-eng.com',
})

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Songs | null>
) {
  await runMiddleware(req, res, cors)
  // const token = await getToken({ req, secret: process.env.JWT_SECRET })

  let data = await Songs.findAll({ order: Sequelize.literal('random()'), limit: 1 })
  if (!data.length) {
    throw new BadRequestError('no this song')
  }
  res.status(200).send(data[0])
}

export default withErrorHandler(handler)