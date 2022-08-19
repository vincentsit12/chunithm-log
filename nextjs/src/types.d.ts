export interface Rating {
    song: string,
    rating: number,
    truncatedRating: string,
    internalRate: number,
    score: number,
    difficulty: Difficulty
    combo: number
}

export type Difficulty = 'ultima' | 'master' | 'expert'
   

export interface Song {

    rate: number,
    combo: number,

}