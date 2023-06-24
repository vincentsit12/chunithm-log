import Records from "db/model/records";
import Songs from "db/model/songs";
import Users from "db/model/users";
import { calculateSingleSongRating, toFixedTrunc } from "./calculateRating";
import { Rating, Song } from "types";
import _ from "lodash";



export async function getRatingList(data: Users | null) {

    let group = _.groupBy(data?.records, k => k.type)

    const bestRatingList =
        _.map<Rating, Rating>(_.orderBy(_.map(group['best'], function (o) {
            let song: Song = o.song[o.difficulty]
            let rating = parseFloat(toFixedTrunc(calculateSingleSongRating(song?.rate, o.score), 2))
            let result: Rating = {
                song: o.song.display_name,
                combo: song?.combo || 0,
                internalRate: song?.rate || 0,
                rating: rating,
                truncatedRating: toFixedTrunc(rating, 2),
                score: o.score,
                difficulty: o.difficulty,
                updatedAt: o.updatedAt.toISOString(),
                scriptUrl: song?.scriptUrl ?? ""
            }
            return result
        }), ['rating'], ['desc']), (k, i) => { return { ...k, order: i + 1 } })
    const recentRatingList =
        _.map(group['recent'], function (o) {
            let song: Song = o.song[o.difficulty]
            let rating = parseFloat(toFixedTrunc(calculateSingleSongRating(song?.rate, o.score), 2))
            let result: Rating = {
                song: o.song.display_name,
                combo: song?.combo || 0,
                internalRate: song?.rate || 0,
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