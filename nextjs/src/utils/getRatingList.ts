import Records from "db/model/records";
import Songs from "db/model/songs";
import Users from "db/model/users";
import { calculateSingleSongRating, getGradeOfScore, toFixedTrunc } from "./calculateRating";
import { Rating, Song } from "types";
import _ from "lodash";



export async function getRatingList(data: Users | null) {

    let group = _.groupBy(data?.records, k => k.type)

    const bestRatingList =
        _.map<Rating, Rating>(_.orderBy(_.flatMap(group['best'], function (o) {
            let song = o.song[o.difficulty]
            if (!song?.rate) return []
            let rating = parseFloat(toFixedTrunc(calculateSingleSongRating(song?.rate, o.score), 2))
            let result: Rating = {
                song: o.song.display_name,
                combo: song?.combo || 0,
                internalRate: song?.rate || 0,
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
            if (!song?.rate) return []
            let rating = parseFloat(toFixedTrunc(calculateSingleSongRating(song?.rate, o.score), 2))
            let result: Rating = {
                song: o.song.display_name,
                combo: song?.combo || 0,
                internalRate: song?.rate || 0,
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