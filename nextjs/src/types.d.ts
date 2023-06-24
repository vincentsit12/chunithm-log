export interface Rating {
    song: string,
    rating: number,
    truncatedRating: string,
    internalRate: number,
    score: number,
    difficulty: Difficulty
    combo: number,
    scriptUrl? : string,
    order? : number,
    updatedAt? : string
}

export type Difficulty = 'ultima' | 'master' | 'expert'
export type RecordType = "best" | "recent"

export interface Song {

    rate: number,
    combo: number,
    scriptUrl? : string
}


