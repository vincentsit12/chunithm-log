import Records from "db/model/records";
import Songs from "db/model/songs";
import Users from "db/model/users";
import { calculateSingleSongRating, getGradeOfScore, toFixedTrunc } from "./calculateRating";
import { ChunithmVersion, CURRENT_VERSION, Rating, Song } from "types";
import _ from "lodash";
import { promises as fs } from 'fs';
import axios from "axios";
import { getJPSongData } from "./api";




export async function getRatingList(data: Users | null) {
    let group = _.groupBy(data?.records, k => k.type)
    const bestRatingList =
        _.map<Rating, Rating>(_.orderBy(_.flatMap(group['best'], function (o) {
            let song = o.song[o.difficulty]
            const songRate = song?.rate
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
                scriptUrl: song?.scriptUrl ?? "",
                version: song?.version || null
            }
            return result
        }), ['rating'], ['desc']), (k, i) => { return { ...k, order: i + 1 } })
    const recentRatingList =
        _.map<Rating, Rating>(_.orderBy(_.flatMap(group['recent'], function (o) {
            let song = o.song[o.difficulty]
            const songRate = song?.rate

            if (!songRate) return []
            if (song?.version != CURRENT_VERSION) return []

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
                scriptUrl: song?.scriptUrl ?? "",
                version: song?.version
            }
            return result
        }), ['rating'], ['desc']), (k, i) => { return { ...k, order: i + 1 } })

    return [bestRatingList, recentRatingList]
}