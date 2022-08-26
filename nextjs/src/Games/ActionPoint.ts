import { MusicNote } from "./MusicNote"

/**
 @ActionPoint
 game object 
 * */
export class ActionPoint {
    canvas: Canvas
    type: string

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
    constructor(canvas: Canvas, type: string, x: number, y: number, kill: () => void, index: number, config: GameConfig) {
        this.type = type;
        this.canvas = canvas
        this.config = config

        function normalize(point: number) {
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
                this.textAlpha -= .25
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
            this.alpha = .5;
            this.onTouched = true
            this.onTouchColor = color;
            this.onHitTimer = setInterval(() => {
                this.alpha -= .25
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
        return !(
            (canvasX < (this.xInCanvs - RMG_OBJECT_RADIUS * 3)) ||
            (canvasX > (this.xInCanvs + RMG_OBJECT_RADIUS * 3)) ||
            (canvasY < (this.yInCanvs - RMG_OBJECT_RADIUS * 3)) ||
            (canvasY > (this.yInCanvs + RMG_OBJECT_RADIUS * 3))
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

        switch (this.type) {
            case "maimai":

                if (this.text) {
                    this.canvas.ctx.beginPath();
                    this.canvas.ctx.setTransform(1, 0, 0, 1, this.xInCanvs - (this.xInCanvs - this.canvas.width / 2) / 5, this.yInCanvs - (this.yInCanvs - this.canvas.height / 2) / 5);
                    this.canvas.ctx.rotate((22.5 + (this.index * 45)) * Math.PI / 180);
                    this.canvas.ctx.font = `bold ${RMG_OBJECT_RADIUS}px Arial`;
                    this.canvas.ctx.textAlign = "center";
                    this.canvas.ctx.lineWidth = 2;
                    this.canvas.ctx.strokeStyle = `rgba(255,255,255 ,${this.textAlpha})`
                    this.canvas.ctx.strokeText(this.text, 0, 0);
                    this.canvas.ctx.fillStyle = this.textColor.replace('%', this.textAlpha.toString());
                    this.canvas.ctx.fillText(this.text, 0, 0);
                    this.canvas.ctx.setTransform(1, 0, 0, 1, 0, 0);
                    this.canvas.ctx.closePath()
                }
                if (this.onTouched) {
                    this.canvas.ctx.beginPath();
                    this.canvas.ctx.fillStyle = this.onTouchColor.replace('%', this.alpha.toString());

                    this.canvas.ctx.arc(this.xInCanvs, this.yInCanvs, this.radius * 3, 0, 2 * Math.PI);
                    this.canvas.ctx.fill();
                    this.canvas.ctx.closePath()
                }

                this.canvas.ctx.beginPath();
                this.canvas.ctx.arc(this.xInCanvs, this.yInCanvs, this.radius, 0, 2 * Math.PI);

                //  this.canvas.ctx.arc(this.xInCanvs, this.yInCanvs, RMG_OBJECT_RADIUS / 3.5, 0, 2 * Math.PI);

                this.canvas.ctx.fillStyle = `rgba(255,255,255,1)`;
                this.canvas.ctx.fill();
                this.canvas.ctx.closePath()
                //  this.canvas.ctx.lineWidth = this.radius * .3
                //  this.canvas.ctx.strokeStyle = 'black'
                //  this.canvas.ctx.stroke();
                //  this.canvas.ctx.closePath();

                break;

            default:
                break;
        }

    }

}
