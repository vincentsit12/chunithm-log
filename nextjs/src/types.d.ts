export interface Rating {
    song: string,
    rating: number,
    truncatedRating: string,
    grade: Grade,
    internalRate: number,
    score: number,
    difficulty: Difficulty
    combo: number,
    scriptUrl?: string,
    order?: number,
    updatedAt?: string
}

export type Difficulty = 'ultima' | 'master' | 'expert'
export type RecordType = "best" | "recent"
export type TableHeader = 'Youtube' | 'Grade' | 'Rank' | 'Name' | 'Script' | 'Base' | 'Score' | 'Rate'
export type Grade = "SSS+" | 'SSS' | "SS+" | "SS" | "S+" | "S" | "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "C" | "D"
export type SortingKeys = keyof Rating
export interface Song {

    rate: number,
    combo: number,
    scriptUrl?: string
}


type ChunithmNetRecord = {
    name: string,
    difficulty: Difficulty,
    score: number
    type: RecordType
}


type ChunithmNetLogin = {
    sid: string,
    password: string
}
