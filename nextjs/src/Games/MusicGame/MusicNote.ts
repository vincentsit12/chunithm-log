/** 
 *@MusicNote
 * */

import { Canvas, GameConfig, GameType, NoteInfo, NoteType, ReactionPoint } from "./musicGameTypes"

export class MusicNote {
    canvas: Canvas
    type: NoteType
    x: number
    y: number
    id: number

    targetX: number
    targetY: number
    targetLength: number
    index: number
    // reactionPoint: ActionPoint
    radius: number

    kill: (id: number) => void
    startTime: number | null
    duration: number

    isEach: boolean
    length: number

    holdDuration?: number
    holdingTime: number
    reversed: boolean

    actualTime: number
    generateTime: number
    judgementTime: number
    holdingStartTime: number

    hit: boolean
    reached: boolean

    gameType: GameType
    config: GameConfig
    constructor(canvas: Canvas, id: number, reactionPoint: ReactionPoint, noteInfo: NoteInfo, kill: (id: number) => void, config: GameConfig) {
        this.canvas = canvas
        this.config = config


        this.id = id
        this.type = noteInfo.type || 'tap'
        this.gameType = noteInfo.gameType


        const { RMG_OBJECT_RADIUS, DURATION } = config

        this.index = reactionPoint.index
        this.radius = RMG_OBJECT_RADIUS;

        const killDelay = 200 //ms

        switch (noteInfo.gameType) {
            case 'maimai':
                /**
                 * start point (.5 , .5)
                 * deltaX , deltaY = note moving speed
                 * scaleConstant = note start line to action point ~= 4 notes
                 */
                var deltaX, deltaY;
                const scaleConstant = 4
                this.x = .5 * canvas.width + (reactionPoint.x - .5 * canvas.width) / scaleConstant;
                this.y = .5 * canvas.height + (reactionPoint.y - .5 * canvas.height) / scaleConstant;
                deltaX = (reactionPoint.x - (.5 * this.canvas.width + (reactionPoint.x - .5 * this.canvas.width) / scaleConstant)) / DURATION
                deltaY = (reactionPoint.y - (.5 * this.canvas.height + (reactionPoint.y - .5 * this.canvas.height) / scaleConstant)) / DURATION
                this.targetX = reactionPoint.x + deltaX * killDelay
                this.targetY = reactionPoint.y + deltaY * killDelay
                //for hold - .4 * canvas.vmin - .4 * canvas.vmin / 4 + this.radius * 2 = max width for start point to action point
                this.targetLength = .4 * canvas.vmin - .4 * canvas.vmin / 4 + this.radius * 2

                break;
            case 'djmania':
                var deltaY;
                this.x = reactionPoint.x
                this.y = 0;
                deltaY = reactionPoint.y / DURATION
                this.targetX = reactionPoint.x
                this.targetY = reactionPoint.y + deltaY * killDelay
                this.targetLength = reactionPoint.y + this.radius

                break;
        }

        this.kill = kill;
        this.startTime = null;
        this.duration = config.DURATION;


        this.isEach = noteInfo.isEach

        //hold
        this.length = this.radius * 2;
        this.holdDuration = noteInfo.holdDuration
        this.holdingTime = 0
        this.holdingStartTime = 0;
        this.reversed = false;


        this.actualTime = noteInfo.time
        this.generateTime = 0
        this.judgementTime = 0

        this.hit = false
        this.reached = false


    }

    draw = (x: number, y: number, length: number, visible = true) => {
        // this.canvas.ctx.globalCompositeOperation = 'destination-atop'
        const ctx = this.canvas.ctx


        switch (this.gameType) {

            case 'maimai':
                if (!visible) {
                    ctx.strokeStyle = 'transparent';
                }
                else {

                    if (this.isEach) {
                        ctx.fillStyle = 'rgba(255,255,0 ,.5)';
                        ctx.strokeStyle = 'yellow';
                    }
                    else {
                        ctx.fillStyle = 'rgba(255,0,255 ,.5)';
                        ctx.strokeStyle = 'red';
                    }
                }
                ctx.lineWidth = this.radius * .4
                if (this.type === 'hold') {
                    ctx.beginPath();
                    ctx.setTransform(1, 0, 0, 1, this.canvas.width / 2, this.canvas.height / 2);
                    if (!this.reversed) {

                        ctx.rotate((-67.5 + 45 * (this.index - 1)) * Math.PI / 180);
                        this.roundRect(ctx, (.4 * this.canvas.vmin * .25) - this.radius, -this.radius, length, this.radius * 2, this.radius, false, true);
                    } else {
                        ctx.rotate(((-67.5 + 45 * (this.index - 1) + 180)) * Math.PI / 180);
                        this.roundRect(ctx, -1 * (.4 * this.canvas.vmin + this.radius), -this.radius, length, this.radius * 2, this.radius, false, true);
                    }
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.closePath();
                }
                else {
                    //center small judgement hint circle
                    ctx.beginPath();
                    ctx.arc(x, y, this.radius / 7, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.closePath();


                    //outer
                    ctx.beginPath();
                    ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    ctx.closePath();
                }
                break;
            case 'djmania':
                const laneWidth = this.canvas.vmin / 4
                if (!visible) {
                    ctx.strokeStyle = 'transparent';
                }
                else {

                    if (this.isEach) {
                        ctx.fillStyle = 'rgba(255,255,0 ,.8)';
                        ctx.strokeStyle = 'rgba(200,200,200 , .8)';
                    }
                    else {
                        ctx.fillStyle = 'rgba(255,0,0 , .8)';
                        ctx.strokeStyle = 'rgba(200,200,200 , .8)';
                    }
                }
                ctx.lineWidth = this.radius * .1
                if (this.type === 'hold') {
                    ctx.beginPath();
                    // ctx.setTransform(1, 0, 0, 1, this.canvas.width / 2, this.canvas.height / 2);
                    if (!this.reversed) {
                        // ctx.rotate((-67.5 + 45 * (this.index - 1)) * Math.PI / 180);
                        this.roundRect(ctx, x - laneWidth / 2, -this.radius, laneWidth, length, this.radius, true, true);
                    } else {
                        this.roundRect(ctx, x - laneWidth / 2, this.canvas.height * 0.9 - length, laneWidth, length, this.radius, true, true);

                    }
                    // ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.closePath();


                }
                else {
                    this.roundRect(ctx, x - laneWidth / 2, y, laneWidth, this.radius, this.radius, true, true);

                    // ctx.beginPath(); 
                    // ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
                    // ctx.fill();
                    // ctx.closePath();
                }
                break;
            default:
                break;
        }


        // this.canvas.ctx.globalAlpha = this.alpha
        // canvasCtx.fillStyle = `rgba(255,255,255,0)`;
        // canvasCtx.fill();



    }

    /**
     * Draws a rounded rectangle using the current state of the canvas.
     * If you omit the last three params, it will draw a rectangle
     * outline with a 5 pixel border radius
     * @param {CanvasRenderingContext2D} ctx
     * @param {Number} x The top left x coordinate
     * @param {Number} y The top left y coordinate
     * @param {Number} width The width of the rectangle
     * @param {Number} height The height of the rectangle
     * @param {Number} [radius = 5] The corner radius; It can also be an object 
     *                 to specify different radii for corners
     * @param {Number} [radius.tl = 0] Top left
     * @param {Number} [radius.tr = 0] Top right
     * @param {Number} [radius.br = 0] Bottom right
     * @param {Number} [radius.bl = 0] Bottom left
     * @param {Boolean} [fill = false] Whether to fill the rectangle.
     * @param {Boolean} [stroke = true] Whether to stroke the rectangle.
     */
    roundRect = (ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: any, fill: boolean, stroke: boolean) => {
        if (typeof stroke === 'undefined') {
            stroke = true;
        }
        if (typeof radius === 'undefined') {
            radius = 5;
        }
        if (typeof radius === 'number') {
            radius = { tl: radius, tr: radius, br: radius, bl: radius };
        } else {
            var defaultRadius: any = { tl: 0, tr: 0, br: 0, bl: 0 };
            for (var side in defaultRadius) {
                radius[side] = radius[side] || defaultRadius[side];
            }
        }
        ctx.beginPath();
        ctx.moveTo(x + radius.tl, y);
        ctx.lineTo(x + width - radius.tr, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius.tr);
        ctx.lineTo(x + width, y + height - radius.br);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius.br, y + height);
        ctx.lineTo(x + radius.bl, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius.bl);
        ctx.lineTo(x, y + radius.tl);
        ctx.quadraticCurveTo(x, y, x + radius.tl, y);
        ctx.closePath();
        if (fill) {
            ctx.fill();
        }
        if (stroke) {
            ctx.stroke();
        }

    }
}