import { MusicNote } from "./MusicNote"

/**
 @ActionPoint
 game object 
 * */
export class ActionPoint {
    canvas: Canvas
    type: GameType

    x: number
    y: number
    radius: number
    xInCanvs: number
    yInCanvs: number

    alpha: number
    textAlpha: number
    text: string
    textColor: string

    onTouched: boolean
    onTouchColor: string


    timer: any
    kill: () => void
    //reaction music game
    onHitTimer: any
    outerRadius: number | null;

    index: number
    musicNotes: MusicNote[]
    config: GameConfig
    constructor(canvas: Canvas, type: GameType, x: number, y: number, kill: () => void, index: number, config: GameConfig) {
        this.type = type;
        this.canvas = canvas
        this.config = config

        function normalize(point: number) {
            if (type === 'djmania') {
                return point
            }
            return (canvas.vmin * point + (canvas.vmax - canvas.vmin) / 2) / canvas.vmax
        }
        this.x = (canvas.width > canvas.height ? normalize(x) : x);

        this.y = (canvas.height > canvas.width ? normalize(y) : y);


        const { RMG_OBJECT_RADIUS } = config
        this.radius = RMG_OBJECT_RADIUS / 3.5
        this.xInCanvs = this.x * canvas.width;
        this.yInCanvs = this.y * canvas.height;

        this.alpha = .5;
        this.textAlpha = 1;
        this.text = '';
        this.textColor = 'white'

        this.onTouchColor = 'rgba(255,255,255,%)'
        this.onTouched = false

        this.timer = null
        this.kill = kill;
        // this.answer_sound = new Audio('click.mp3')

        // this.answer_sound.volume = 1

        //reaction music game
        this.onHitTimer = null;
        this.outerRadius = null;

        this.musicNotes = [];

        this.index = index;

    }
    killMusicNote = (id: number) => {
        this.musicNotes = this.musicNotes.filter(k => k.id != id)
    }
    fadeOut = () => {
        this.timer = setInterval(() => {
            this.alpha -= 0.25
            if (this.alpha <= 0) {
                clearInterval(this.timer)
                this.kill()
            }
        }, 100);
    }
    showJudgement = (text: string, color: string) => {
        if (!this.timer) {
            this.textColor = color;
            this.text = text
            this.textAlpha = 1;
            this.timer = setInterval(() => {
                this.textAlpha -= .34
                if (this.textAlpha <= 0) {
                    clearInterval(this.timer)
                    this.timer = null
                    this.text = ''
                }
            }, 100);
        }
        else {
            this.textColor = color;
            this.text = text
            this.textAlpha = 1;
        }
    }
    onTouch = (color: string) => {
        if (!this.onHitTimer) {
            this.alpha = .3;
            this.onTouched = true
            this.onTouchColor = color;
            this.onHitTimer = setInterval(() => {
                this.alpha -= .15
                if (this.alpha <= 0) {
                    clearInterval(this.onHitTimer)
                    this.onHitTimer = null
                    this.onTouched = false
                    // this.onTouchColor = null;
                }
            }, 100);
        } else {
            this.alpha = .5;
            this.onTouched = true
            this.onTouchColor = color;
        }
    }

    isCollide(poseLandmark: any) {
        const { RMG_OBJECT_RADIUS } = this.config
        const { x, y } = poseLandmark
        const canvasX = x * this.canvas.width
        const canvasY = y * this.canvas.height
        const collideRange = this.type === "maimai" ? RMG_OBJECT_RADIUS * 5 : 0.2 * this.canvas.width

        return !(
            (canvasX < (this.xInCanvs - collideRange)) ||
            (canvasX > (this.xInCanvs + collideRange)) ||
            (canvasY < (this.yInCanvs - collideRange)) ||
            (canvasY > (this.yInCanvs + collideRange))
        );



    }

    checkBoxCollide(box1: any, box2: any) {

        var myleft = box1.x;
        var myright = box1.x + (box1.width);
        var mytop = box1.y;
        var mybottom = box1.y + (box1.height);

        var otherleft = box2.x;
        var otherright = box2.x + (box2.width);
        var othertop = box2.y;
        var otherbottom = box2.y + (box2.height);

        return !((mybottom < othertop) || (mytop > otherbottom) || (myright < otherleft) || (myleft > otherright))
    }


    draw() {
        const { RMG_OBJECT_RADIUS } = this.config
        const ctx = this.canvas.ctx
        switch (this.type) {
            case "maimai":

                if (this.text) {
                    ctx.beginPath();
                    ctx.setTransform(1, 0, 0, 1, this.xInCanvs - (this.xInCanvs - this.canvas.width / 2) / 5, this.yInCanvs - (this.yInCanvs - this.canvas.height / 2) / 5);
                    ctx.rotate((22.5 + (this.index * 45)) * Math.PI / 180);
                    ctx.font = `bold ${RMG_OBJECT_RADIUS}px Arial`;
                    ctx.textAlign = "center";
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = `rgba(255,255,255 ,${this.textAlpha})`
                    ctx.strokeText(this.text, 0, 0);
                    ctx.fillStyle = this.textColor.replace('%', this.textAlpha.toString());
                    ctx.fillText(this.text, 0, 0);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.closePath()
                }
                if (this.onTouched) {
                    ctx.beginPath();
                    ctx.fillStyle = this.onTouchColor.replace('%', this.alpha.toString());

                    ctx.arc(this.xInCanvs, this.yInCanvs, this.radius * 3, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.closePath()
                }

                ctx.beginPath();
                ctx.arc(this.xInCanvs, this.yInCanvs, this.radius, 0, 2 * Math.PI);

                //  ctx.arc(this.xInCanvs, this.yInCanvs, RMG_OBJECT_RADIUS / 3.5, 0, 2 * Math.PI);

                ctx.fillStyle = `rgba(255,255,255,1)`;
                ctx.fill();
                ctx.closePath()
                //  ctx.lineWidth = this.radius * .3
                //  ctx.strokeStyle = 'black'
                //  ctx.stroke();
                //  ctx.closePath();

                break;

            case "djmania":

                if (this.text) {
                    ctx.beginPath();
                    ctx.setTransform(1, 0, 0, 1, this.xInCanvs, this.yInCanvs - (this.yInCanvs - this.canvas.height / 2) / 5);
                    // ctx.rotate((22.5 + (this.index * 45)) * Math.PI / 180);
                    ctx.font = `bold ${RMG_OBJECT_RADIUS}px Arial`;
                    ctx.textAlign = "center";
                    ctx.lineWidth = 2;
                    ctx.strokeStyle = `rgba(255,255,255 ,${this.textAlpha})`
                    ctx.strokeText(this.text, 0, 0);
                    ctx.fillStyle = this.textColor.replace('%', this.textAlpha.toString());
                    ctx.fillText(this.text, 0, 0);
                    ctx.setTransform(1, 0, 0, 1, 0, 0);
                    ctx.closePath()
                }
                if (this.onTouched) {
                    ctx.beginPath();
                    ctx.fillStyle = this.onTouchColor.replace('%', this.alpha.toString());

                    ctx.arc(this.xInCanvs, this.yInCanvs, this.radius * 3, 0, 2 * Math.PI);
                    ctx.fill();
                    ctx.closePath()
                }

                ctx.beginPath();
                ctx.arc(this.xInCanvs, this.yInCanvs, this.radius, 0, 2 * Math.PI);

                //  ctx.arc(this.xInCanvs, this.yInCanvs, RMG_OBJECT_RADIUS / 3.5, 0, 2 * Math.PI);

                ctx.fillStyle = `rgba(255,255,255,1)`;
                ctx.fill();
                ctx.closePath()
                //  ctx.lineWidth = this.radius * .3
                //  ctx.strokeStyle = 'black'
                //  ctx.stroke();
                //  ctx.closePath();

                break;
            default:
                break;
        }

    }

}
