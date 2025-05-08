import { TypeOptions } from "react-toastify"

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
    version?: ChunithmVersion | null,
    order?: number,
    updatedAt?: string
}

export type Difficulty = 'ultima' | 'master' | 'expert'
export type RecordType = "best" | "recent"
export type TableHeader = 'Youtube' | 'Grade' | 'Rank' | 'Name' | 'Script' | 'Base' | 'Score' | 'Rate'
export type Grade = "SSS+" | 'SSS' | "SS+" | "SS" | "S+" | "S" | "AAA" | "AA" | "A" | "BBB" | "BB" | "B" | "C" | "D"
export type SortingKeys = keyof Rating
export type SongGenre = 'ORI' | 'VAR' | '撃舞' | '東方' | 'P&A' | 'nico' | 'イロ'
export type MaimaiSongGenre = '舞' | '撃&チ' | 'ゲ&バ' | '東方' | 'P&ア' | 'nico'
export type MaiMaiDifficulty = 'master' | 'expert' | 'remaster' | 'advanced'

// Chunithm Version
export const CURRENT_VERSION: ChunithmVersion = 'Verse'
export type ChunithmVersion  =  'Verse' | 'Luminous Plus' | 'Luminous' | 'Sun Plus' | 'Sun' | 'New Plus' | 'New' | 'Paradise Lost' | 'Paradise' | 'Crystal Plus' | 'Crystal' | 'Amazon Plus' | 'Amazon' | 'Star Plus' | 'Star' | 'Air Plus' | 'Air' | 'Chunithm Plus' | 'Chunithm'

export interface Song {
    rate: number,
    combo: number,
    scriptUrl?: string
    version?: ChunithmVersion
}

export type ChunithmNetRecord = {
    name: string,
    difficulty: Difficulty,
    score: number
    type: RecordType
}


export type ChunithmNetLogin = {
    sid: string,
    password: string
}

export type MessageDetails = {
    withNotification?: boolean,
    onlyPlayer?: boolean,
    type? :  TypeOptions
}