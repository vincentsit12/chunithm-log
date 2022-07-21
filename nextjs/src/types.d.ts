export interface Rating {
    song: string,
    rating: number,
    truncatedRating : string,
    score: number,
    difficulty: 'ultima' | 'master' | 'expert'
}