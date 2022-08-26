/** 
 *@MusicNote
 * */

export class MusicNote {
    canvas: Canvas
    type: NoteType
    x: number
    y: number
    id: number


    targetX: number
    targetY: number
    targetWidth: number
    index: number
    // reactionPoint: ActionPoint
    radius: number

    kill: (id: number) => void
    startTime: number | null
    duration: number

    isEach: boolean
    width: number

    holdDuration?: number
    holdingTime: number
    reversed: boolean

    actualTime: number
    generateTime: number
    judgementTime: number
    holdingStartTime: number

    hit: boolean
    reached: boolean
    config: GameConfig
    constructor(canvas: Canvas, id: number, reactionPoint: ReactionPoint, noteInfo: NoteInfo, kill: (id: number) => void, config: GameConfig) {
        this.canvas = canvas
        this.config = config


        this.id = id
        this.x = .5 * canvas.width + (reactionPoint.x - .5 * canvas.width) / 4;
        this.y = .5 * canvas.height + (reactionPoint.y - .5 * canvas.height) / 4;
        this.type = noteInfo.type || 'tap'


        this.targetX = reactionPoint.x + noteInfo.deltaX * 200
        this.targetY = reactionPoint.y + noteInfo.deltaY * 200

        const { RMG_OBJECT_RADIUS } = config
        this.targetWidth = .4 * canvas.vmin - .4 * canvas.vmin / 4 + RMG_OBJECT_RADIUS * 2
        this.index = reactionPoint.index
        this.radius = RMG_OBJECT_RADIUS;

        this.kill = kill;
        this.startTime = null;
        this.duration = config.DURATION;


        this.isEach = noteInfo.isEach

        //hold
        this.width = RMG_OBJECT_RADIUS * 2;
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

    draw = (x: number, y: number, width: number, visible = true) => {
        // this.canvas.ctx.globalCompositeOperation = 'destination-atop'
        const { RMG_OBJECT_RADIUS } = this.config
        this.canvas.ctx.lineWidth = this.radius * .4

        if (!visible) {
            this.canvas.ctx.strokeStyle = 'transparent';
        }
        else {

            if (this.isEach) {
                this.canvas.ctx.fillStyle = 'rgba(255,255,0 ,.5)';
                this.canvas.ctx.strokeStyle = 'yellow';
            }
            else {
                this.canvas.ctx.fillStyle = 'rgba(255,0,255 ,.5)';
                this.canvas.ctx.strokeStyle = 'red';
            }
        }


        if (this.type === 'hold') {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.setTransform(1, 0, 0, 1, this.canvas.width / 2, this.canvas.height / 2);
            if (!this.reversed) {

                this.canvas.ctx.rotate((-67.5 + 45 * (this.index - 1)) * Math.PI / 180);
                this.roundRect(this.canvas.ctx, .4 * this.canvas.vmin * .25 - RMG_OBJECT_RADIUS, - RMG_OBJECT_RADIUS, width, RMG_OBJECT_RADIUS * 2, RMG_OBJECT_RADIUS, false, true);
            } else {
                this.canvas.ctx.rotate(((-67.5 + 45 * (this.index - 1) + 180)) * Math.PI / 180);
                this.roundRect(this.canvas.ctx, -1 * (.4 * this.canvas.vmin + RMG_OBJECT_RADIUS), -RMG_OBJECT_RADIUS, width, RMG_OBJECT_RADIUS * 2, RMG_OBJECT_RADIUS, false, true);
            }
            this.canvas.ctx.setTransform(1, 0, 0, 1, 0, 0);
            this.canvas.ctx.closePath();


        }
        else {
            this.canvas.ctx.beginPath();
            this.canvas.ctx.arc(x, y, RMG_OBJECT_RADIUS / 7, 0, 2 * Math.PI);
            this.canvas.ctx.fill();
            this.canvas.ctx.closePath();

            this.canvas.ctx.beginPath();
            this.canvas.ctx.arc(x, y, this.radius, 0, 2 * Math.PI);
            this.canvas.ctx.stroke();
            this.canvas.ctx.closePath();
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