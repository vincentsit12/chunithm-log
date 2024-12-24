import Records from "db/model/records";
import Songs from "db/model/songs";
import Users from "db/model/users";
import { calculateSingleSongRating, getGradeOfScore, toFixedTrunc } from "./calculateRating";
import { Rating, Song } from "types";
import _ from "lodash";
import { promises as fs } from 'fs';



export async function getRatingList(data: Users | null, isJP : boolean = false) {
    let jpData : Songs[] = []
    if (isJP) {
        let jpDataString = await fs.readFile(process.cwd() + '/src/data/songs_jp.json', 'utf8');
        jpData = JSON.parse(jpDataString) as Songs[]
    }
    let group = _.groupBy(data?.records, k => k.type)
    const bestRatingList =
        _.map<Rating, Rating>(_.orderBy(_.flatMap(group['best'], function (o) {
            let song = o.song[o.difficulty]
            let jpSongData = isJP ? _.find(jpData, k => {
                return k.name == o.song.name
            }) : null
            const songRate = isJP && jpSongData ? jpSongData[o.difficulty]?.rate : song?.rate
            if (!songRate) return []
            let rating = parseFloat(toFixedTrunc(calculateSingleSongRating(songRate, o.score), 2))
            let result: Rating = {
                song: o.song.display_name,
                combo: song?.combo || 0,
                internalRate: songRate || 0,
                rating: rating,
                grade: getGradeOfScore(o.score),
                truncatedRating: toFixedTrunc(rating, 2),
                score: o.score,
                difficulty: o.difficulty,
                updatedAt: o.updatedAt.toISOString(),
                scriptUrl: song?.scriptUrl ?? ""
            }
            return result
        }), ['rating'], ['desc']), (k, i) => { return { ...k, order: i + 1 } })
    const recentRatingList =
        _.flatMap(group['recent'], function (o) {
            let song = o.song[o.difficulty]
            let jpSongData = isJP ? _.find(jpData, k => {
                return k.name == o.song.name
            }) : null
            const songRate = isJP && jpSongData ? jpSongData[o.difficulty]?.rate : song?.rate
            if (!songRate) return []
            let rating = parseFloat(toFixedTrunc(calculateSingleSongRating(songRate, o.score), 2))
            let result: Rating = {
                song: o.song.display_name,
                combo: song?.combo || 0,
                internalRate: songRate || 0,
                grade: getGradeOfScore(o.score),
                rating: rating,
                truncatedRating: toFixedTrunc(rating, 2),
                score: o.score,
                difficulty: o.difficulty,
                scriptUrl: song?.scriptUrl ?? ""
            }
            return result
        });

    return [bestRatingList, recentRatingList]
}