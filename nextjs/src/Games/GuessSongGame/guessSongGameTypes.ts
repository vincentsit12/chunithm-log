import Songs, { MaimaiSongs } from "db/model/songs";

export interface Player {
    name: string;
    id: string;
    isReady: boolean;
    isHost: boolean;
    isJoined: boolean;
    score: number;
    isAnswered: boolean;
    isSurrendered: boolean;
    isRequestedLonger: boolean;
    isRequestedAnotherSection: boolean;
}

export interface RoomEvent {
    roomID: string;
    roomInfo?: RoomInfo;
    playerID: string;
    playerName: string;
}

export interface RoomInfo {
    roomID: string;
    noOfRound: number;
    gameType: number;
    players: Player[];
}

export interface GuessSongGameOption {
    youtubeID: string;
    startTime: string;
    duration: string;
    isFixedStartTime: boolean;
    answerRaceChoices: string[];
    answerRaceChoicesNumber: number;
}

export interface CustomSong {
    id: number;
    youtube_link: string;
    display_name: string;
    startTime: number;
}

export enum GuessSongGameType {
    chunithm = 1,
    maimai,
    playlist,
    custom,
}

export type GuessGameSong = Songs | MaimaiSongs | CustomSong; 