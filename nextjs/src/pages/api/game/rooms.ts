// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Songs from 'db/model/songs'
import Users from 'db/model/users'
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'
import { getToken } from 'next-auth/jwt'
import _, { values } from 'lodash'
import { Op } from 'sequelize'
import axios from 'axios'
import { GuessSongGameRoom } from '../socket'
import { NextApiResponseWithSocket } from '../type'
import shared from '../shared'
// var corsOptions = {
//   origin: 'https://chunithm-net-eng.com.com',
//   optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// }
const cors = Cors({
    methods: ['GET'],
    origin: 'https://chunithm-net-eng.com',
})

interface GuessSongGameRoomRes extends GuessSongGameRoom {
    playerCount: number
}

async function handler(
    req: NextApiRequest,
    res: NextApiResponseWithSocket<GuessSongGameRoomRes[]>
) {
    await runMiddleware(req, res, cors)
    const rooms = Array.from(shared.rooms.values())
    let response: GuessSongGameRoomRes[] = rooms.map(k => {
        return {
            ...k,
            playerCount: k.players.size
        }
    })
    res.status(200).json(response)

}

export default withErrorHandler(handler)