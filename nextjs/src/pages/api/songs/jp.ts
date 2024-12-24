// Next.js API route support: https://nextjs.org/docs/api-routes/introduction
import Songs from 'db/model/songs'
import Users from 'db/model/users'
import { BadRequestError } from 'errors/BadRequestError'
import type { NextApiRequest, NextApiResponse } from 'next'
import withErrorHandler from 'utils/errorHandler'
import Cors from 'cors'
import { runMiddleware } from 'utils/runMiddleware'
import _ from 'lodash'
import { promises as fs } from 'fs';
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
    let song = await fs.readFile(process.cwd() + '/src/data/songs_jp.json', 'utf8');
    if (song)
        res.status(200).json(song.toString())
    else throw new BadRequestError("error")
}

export default withErrorHandler(handler)