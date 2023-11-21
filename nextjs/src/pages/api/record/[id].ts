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
    res: NextApiResponse<string>
) {
    await runMiddleware(req, res, cors)
    if (req.method === 'PUT') {
        const userId = parseInt(decrypt(req.query.id as string))

        if (!userId)
            throw new BadRequestError('no user provided')
        if (!req.body.data || req.body.data.length <= 0) throw new BadRequestError('no data provided')
        let songs = await Songs.findAll({})
        let songsObj = _.keyBy(songs, function (o) {
            return o.name;
        });
        const validSongsData = _.filter<ChunithmNetRecord>(req.body.data, k => songsObj[reEscape(k.name)] !== undefined)
        let newRecords = _.map(validSongsData, ((k) => {

            return {
                // name: k.name,
                user_id: userId,
                song_id: songsObj[reEscape(k.name)].id,
                // rate: songsObj[reEscape(k.name)][k.difficulty],
                difficulty: k.difficulty,
                score: k.score,
                type: k.type
            } as Records
        }))

        let records = await Records.findAll({ where: { user_id: userId } })
        let recordsGrp = _.groupBy<Records>(records, 'type')

        let updatedRecords: Records[] = []
        let recentCount = 0

        for (let i = 0; i < newRecords.length; i++) {
            if (newRecords[i].type === 'best') {
                let index = _.findIndex(recordsGrp['best'], k => k.song_id === newRecords[i].song_id && k.difficulty === newRecords[i].difficulty)
                if (index >= 0) {
                    newRecords[i].id = recordsGrp['best'][index].id
                    if (newRecords[i].score > recordsGrp['best'][index].score) {
                        updatedRecords.push(newRecords[i])
                    }
                }
                else {
                    updatedRecords.push(newRecords[i])
                }
               
            }
            else {
                if (recordsGrp['recent'] && (recordsGrp['recent'].length > recentCount)) {
                    newRecords[i].id = recordsGrp['recent'][recentCount].id
                }
                updatedRecords.push(newRecords[i])
                recentCount++
            }
        }
        console.table(updatedRecords)

        await Records.bulkCreate(updatedRecords,
            {
                updateOnDuplicate: ['score', 'song_id', 'difficulty', "updatedAt"],
            });

        // await Records.destroy({ where: { user_id: userId }, force: true })
        // await Records.bulkCreate(data)


        res.status(200).send('update success')
    }
    else throw new BadRequestError(`do not accept ${req.method} `)


}

export default withErrorHandler(handler)