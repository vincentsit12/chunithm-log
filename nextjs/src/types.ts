export interface Rating {
    song: string,
    rating: string,
    score: number,
    difficulty: 'ultima' | 'master' | 'expert'
}