export interface Rating {
    song: string,
    rating: number,
    truncatedRating: string,
    internalRate : number,
    score: number,
    difficulty: 'ultima' | 'master' | 'expert',
    combo : number
}

export interface Song {

    rate: number,
    combo: number,

}