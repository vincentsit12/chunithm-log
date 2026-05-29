export interface NoteInfo {
    gameType : GameType
    type: NoteType
    holdDuration?: number,
    isEach: boolean,
    time: number
}

export interface ReactionPoint {
    index: number,
    x: number,
    y: number
}

export type NoteType = 'tap' | 'hold'

export type GameType = 'maimai' | 'djmania'

export type Canvas = {
    ctx: CanvasRenderingContext2D
    width: number
    height: number,
    vmin: number
    vmax: number,
}

export type GameConfig = {
    RMG_CENTERLINE_RADIUS: number,
    RMG_OBJECT_RADIUS: number,

    SPEED: number,
    DURATION: number,
    BPM: number
}