interface NoteInfo {
    type: NoteType
    holdDuration?: number,
    deltaX: number,
    deltaY: number,
    isEach: boolean,
    time: number
}

interface ReactionPoint {
    index: number,
    x: number,
    y: number
}

type NoteType = 'tap' | 'hold'

type Canvas = {
    ctx: CanvasRenderingContext2D
    width: number
    height: number,
    vmin: number
    vmax: number,
}

type GameConfig = {
    RMG_CENTERLINE_RADIUS: number,
    RMG_OBJECT_RADIUS: number,
    
    SPEED: number,
    DURATION: number,
    BPM: number
}