import Songs, { MaimaiSongs } from "db/model/songs";
import { Player } from "./Player";
import { PlaylistSourceType } from "@/db/model/playlists";

export interface RoomEvent {
    roomID: string;
    roomInfo?: RoomInfo;
    playerID: string;
    playerName: string;
}

export interface RoomInfo {
    roomID: string;
    noOfRound: number;
    playlistId: string;
    players: Player[];
}

export interface PlaylistSummary {
    id: string;
    name: string;
    creator: string;
    source_type: PlaylistSourceType;
    source_ref?: string;
    metadata?: Record<string, unknown>;
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

export type GuessGameSong = Songs | MaimaiSongs | CustomSong; 