import { log } from "console"
import { ActionPoint } from "./ActionPoint"
import { MusicNote } from "./MusicNote"

export class Game {
    canvasElement: HTMLCanvasElement
    canvas: Canvas
    music: HTMLAudioElement
    type: string
    timeline: (string | string[])[]
    isStarted: boolean
    // isCountDownStarted: boolean
    score: number
    timer: any
    reactionPoints: ActionPoint[]
    musicNotes: MusicNote[]
    config: GameConfig
    timerId: any[]
    drawId: number
    constructor(
        canvas: HTMLCanvasElement,
        type: string,
        music: HTMLAudioElement,
        timeline: (string | string[])[],
        config: GameConfig
    ) {
        // this.config;

        // this.poseLandmarks = [];
        this.type = type;
        // this.playerName = playerName || 'GUEST'
        this.canvasElement = canvas
        // this.canvasElement.addEventListener('touchstart', this.ontouchstart);
        canvas.width = canvas.clientWidth
        canvas.height = canvas.clientHeight
        this.canvas = {
            ctx: canvas.getContext('2d')!,
            width: canvas.width,
            height: canvas.height,
            vmax: Math.max(canvas.height, canvas.width),
            vmin: Math.min(canvas.height, canvas.width)
        }

        //isStarted = game start
        this.isStarted = false;
        //isCountDownStarted = counting start
        // this.isCountDownStarted = false;

        this.score = 0;
        //reaction game 

        // this.timer = null

        //reaction music game
        this.reactionPoints = []
        this.musicNotes = []

        this.timeline = timeline
        this.timerId = []
        this.drawId = 0
        this.config = config
        this.music = music
        music.volume = .5
        music.muted = true
        music.load()


        // let tscore = 0
        // let t = timeline.flat()
        // for (let i = 0; i <= t.length; i++) {
        //     if (parseInt(t[i]) > 9) {
        //         tscore += 2000;
        //     }
        //     else if (parseInt(t[i]) > 0) {
        //         tscore += 1000;
        //     }
        // }

    }
    checkReactionTime = (index: number) => {
        let color = ''
        let _index = index - 1
        if (this.reactionPoints[_index].musicNotes.length <= 0) {
            return `rgba(255, 255, 255 ,%)`
        }
        if (this.reactionPoints[_index].musicNotes[0].type === 'hold') {
            this.reactionPoints[_index].musicNotes[0].hit = true
            //hold effect
            color = 'rgba(255, 255, 255 ,0)'
        }
        else {
            let reactionTime = Math.abs(performance.now() - this.reactionPoints[_index].musicNotes[0].judgementTime)

            if (reactionTime <= 50) {
                this.reactionPoints[_index].musicNotes[0].hit = true
                // console.log('perfect', reactionTime);
                this.score += 1000
                color = `rgba(255, 138, 6 ,%)`
                this.reactionPoints[_index].showJudgement('PERFECT', `rgba(255, 138, 6 ,%)`)
                this.reactionPoints[_index].killMusicNote(this.reactionPoints[_index].musicNotes[0].id)

            }
            else if (reactionTime <= 100) {
                this.reactionPoints[_index].musicNotes[0].hit = true
                // console.log('great', reactionTime);
                this.score += 800
                color = `rgba(214, 78, 62 ,%)`
                this.reactionPoints[_index].showJudgement('GREAT', `rgba(214, 78, 62 ,%)`)
                this.reactionPoints[_index].killMusicNote(this.reactionPoints[_index].musicNotes[0].id)

            }
            else if (reactionTime >= 100 && reactionTime <= 150) {
                this.reactionPoints[_index].musicNotes[0].hit = true

                this.score += 500
                color = `rgba(11, 250, 80 ,%)`
                this.reactionPoints[_index].showJudgement('GOOD', `rgba(11, 250, 80 ,%)`)
                this.reactionPoints[_index].killMusicNote(this.reactionPoints[_index].musicNotes[0].id)
            }
            else return `rgba(255, 255, 255 ,%)`
        }
        // }
        // scoreText.innerHTML = this.score
        return color
    }


    generateMusicNote = (notesString: string, i: number, j = 1, length = 1) => {
        const { BPM, DURATION } = this.config
        let notePos = parseInt(notesString)
        if (notePos <= 0) return

        let time = 240 / BPM * 1000 * (i + 1) + 240 / BPM / length * j * 1000 - DURATION

        //tap-hold
        if (notesString.includes('/')) {
            let eachArray = notesString.split('/')

            let holdArray = eachArray[1].split('h')

            let holdDuration = 1 / parseInt(holdArray[1]) * parseInt(holdArray[2]) * 240 / BPM * 1000


            let reactionPoint = this.reactionPoints[parseInt(eachArray[1]) - 1]
            let deltaX = (reactionPoint.xInCanvs - (.5 * this.canvas.width + (reactionPoint.xInCanvs - .5 * this.canvas.width) / 4)) / DURATION
            let deltaY = (reactionPoint.yInCanvs - (.5 * this.canvas.height + (reactionPoint.yInCanvs - .5 * this.canvas.height) / 4)) / DURATION

            let reactionPoint2 = this.reactionPoints[notePos - 1]
            let deltaX2 = (reactionPoint2.xInCanvs - (.5 * this.canvas.width + (reactionPoint2.xInCanvs - .5 * this.canvas.width) / 4)) / DURATION
            let deltaY2 = (reactionPoint2.yInCanvs - (.5 * this.canvas.height + (reactionPoint2.yInCanvs - .5 * this.canvas.height) / 4)) / DURATION

            this.musicNotes.push(
                new MusicNote(this.canvas, Math.random(),
                    { index: parseInt(eachArray[1]), x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                    { type: 'hold', holdDuration: holdDuration, deltaX: deltaX, deltaY: deltaY, isEach: true, time: time }
                    , reactionPoint.killMusicNote, this.config))

            this.musicNotes.push(new MusicNote(this.canvas, Math.random(),
                { index: parseInt(notesString), x: reactionPoint2.xInCanvs, y: reactionPoint2.yInCanvs },
                { type: 'tap', deltaX: deltaX2, deltaY: deltaY2, isEach: true, time: time },
                reactionPoint2.killMusicNote, this.config))
        }

        //tap , hold , tap-tap
        else {
            if (notesString.includes('h')) {
                let holdArray = notesString.split('h')
                let holdDuration = 1 / parseInt(holdArray[1]) * parseInt(holdArray[2]) * 240 / BPM * 1000
                let reactionPoint = this.reactionPoints[notePos - 1]
                let deltaX = (reactionPoint.xInCanvs - (.5 * this.canvas.width + (reactionPoint.xInCanvs - .5 * this.canvas.width) / 4)) / DURATION
                let deltaY = (reactionPoint.yInCanvs - (.5 * this.canvas.height + (reactionPoint.yInCanvs - .5 * this.canvas.height) / 4)) / DURATION
                this.musicNotes.push(
                    new MusicNote(this.canvas, Math.random(),
                        { index: notePos, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { type: 'hold', holdDuration: holdDuration, deltaX: deltaX, deltaY: deltaY, isEach: false, time: time }
                        , reactionPoint.killMusicNote, this.config))
            }
            else if (notePos - 1 >= 0) {
                if (notePos - 1 > 9) {
                    let digit1 = Math.trunc(notePos / 10)
                    let digit2 = notePos % 10
                    let reactionPoint = this.reactionPoints[digit1 - 1]
                    let reactionPoint2 = this.reactionPoints[digit2 - 1]
                    let deltaX = (reactionPoint.xInCanvs - (.5 * this.canvas.width + (reactionPoint.xInCanvs - .5 * this.canvas.width) / 4)) / DURATION
                    let deltaY = (reactionPoint.yInCanvs - (.5 * this.canvas.height + (reactionPoint.yInCanvs - .5 * this.canvas.height) / 4)) / DURATION
                    let deltaX2 = (reactionPoint2.xInCanvs - (.5 * this.canvas.width + (reactionPoint2.xInCanvs - .5 * this.canvas.width) / 4)) / DURATION
                    let deltaY2 = (reactionPoint2.yInCanvs - (.5 * this.canvas.height + (reactionPoint2.yInCanvs - .5 * this.canvas.height) / 4)) / DURATION
                    this.musicNotes.push(new MusicNote(this.canvas, Math.random(),
                        { index: digit1, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { type: 'tap', deltaX: deltaX, deltaY: deltaY, isEach: true, time: time }, reactionPoint.killMusicNote, this.config))
                    this.musicNotes.push(new MusicNote(this.canvas, Math.random(),
                        { index: digit2, x: reactionPoint2.xInCanvs, y: reactionPoint2.yInCanvs },
                        { type: 'tap', deltaX: deltaX2, deltaY: deltaY2, isEach: true, time: time }, reactionPoint2.killMusicNote, this.config))


                }
                else {
                    let reactionPoint = this.reactionPoints[parseInt(notesString) - 1]
                    let deltaX = (reactionPoint.xInCanvs - (.5 * this.canvas.width + (reactionPoint.xInCanvs - .5 * this.canvas.width) / 4)) / DURATION
                    let deltaY = (reactionPoint.yInCanvs - (.5 * this.canvas.height + (reactionPoint.yInCanvs - .5 * this.canvas.height) / 4)) / DURATION



                    this.musicNotes.push(new MusicNote(this.canvas, Math.random(),
                        { index: parseInt(notesString), x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { type: 'tap', deltaX: deltaX, deltaY: deltaY, isEach: false, time: time }, reactionPoint.killMusicNote, this.config))

                }
            }
        }
    }
    preGenerateMusicNote = () => {
        for (let i = 0; i < this.timeline.length; i++) {
            if (Array.isArray(this.timeline[i])) {
                for (let j = 0; j < this.timeline[i].length; j++) {

                    // setTimeout(() => {

                    this.generateMusicNote(this.timeline[i][j], i, j, this.timeline[i].length)

                    // }, 240 / BPM * 1000 * (i + 1) + 240 / BPM / timeline[i].length * j * 1000 - DURATION);



                }
            }

            else {

                // setTimeout(() => {


                this.generateMusicNote(this.timeline[i] as string, i)
                // }, 240 / BPM * 1000 * (i + 1) + 240 / BPM * 1000 - DURATION)

            }

        }
    }
    scheuleMusicNote = () => {
        const { DURATION, RMG_OBJECT_RADIUS } = this.config
        this.musicNotes.forEach((k) => {
            this.timerId.push(setTimeout(() => {

                k.generateTime = performance.now()
                k.judgementTime = k.generateTime + k.duration
                if (k.type === 'hold') {
                    this.timerId.push(setTimeout(() => {
                        //reverse
                        // console.log('reverse: ');
                        k.reached = false
                        k.reversed = true
                        // k.width = k.targetWidth
                        k.targetWidth = RMG_OBJECT_RADIUS * 2
                        k.startTime = null


                    }, k.holdDuration! - DURATION))

                }
                else {
                    // setTimeout(() => {
                    //     this.reactionPoints[k.index - 1].answer_sound.currentTime = 0
                    //     this.reactionPoints[k.index - 1].answer_sound.play()
                    // }, DURATION)
                }
                this.reactionPoints[k.index - 1].musicNotes.push(k)

            }, k.actualTime))

        })
    }

    drawMusicNote = (time: number) => {
        // this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

        for (let i = 0; i < this.reactionPoints.length; i++) {
            for (let j = 0; j < this.reactionPoints[i].musicNotes.length; j++) {
                const note = this.reactionPoints[i].musicNotes[j]
                if (!note.startTime) // it's the first frame
                    note.startTime = time || performance.now();


                // deltaTime should be in the range [0 ~ 1]
                var judgementTime = (time - note.startTime) / note.duration;
                // currentPos = previous position + (difference * deltaTime)
                var deltaTime = (time - note.startTime) / (note.duration + 200);
                var currentX = note.x + ((note.targetX - note.x) * deltaTime);
                var currentY = note.y + ((note.targetY - note.y) * deltaTime);

                var currentWidth = note.width + ((note.targetWidth - note.width) * judgementTime);
                if (note.type === 'hold') {
                    if (judgementTime >= 1) {

                        if (note.reached) {
                            note.draw(currentX, currentY, note.targetWidth);
                        }
                        else {
                            // console.log('reached');
                            note.reached = true
                            note.width = note.targetWidth
                            note.draw(note.x, note.y, note.targetWidth);

                        }

                        if (note.reached && note.reversed) {

                            if (note.holdingTime >= note.holdDuration! * 0.5) {
                                // console.log('perfect', reactionTime);
                                this.score += 1000
                                this.reactionPoints[i].showJudgement('PERFECT', `rgba(255, 138, 6 ,%`)

                            }
                            else if (note.holdingTime >= note.holdDuration! * 0.3) {
                                // console.log('great', reactionTime);
                                this.score += 800
                                // this.reactionPoints[_index].changeColor('red')
                                this.reactionPoints[i].showJudgement('GREAT', `rgba(214, 78, 62 ,%`)

                            }
                            else if (note.holdingTime > 0) {

                                this.score += 500
                                this.reactionPoints[i].showJudgement('GOOD', `rgba(11, 250, 80 ,%`)
                            }
                            else if (note.holdingTime <= 0) {
                                this.reactionPoints[i].showJudgement('MISS', `rgba(115, 115, 115  ,%`)

                            }


                            note.kill(note.id);
                        }
                    }
                    else {
                        note.draw(currentX, currentY, currentWidth);
                    }
                }

                else {
                    if (judgementTime >= 1) {
                        note.reached = true
                    }
                    if (deltaTime >= 1) { // note means we ended our animation
                        if (note.reached) {
                            if (!note.hit)
                                this.reactionPoints[i].showJudgement('MISS', `rgba(115, 115, 115, %`)

                            // note.draw(note.x, note.y, false)

                            note.kill(note.id);

                        }
                    }
                    else {
                        note.draw(currentX, currentY, currentWidth);
                    }
                }





                if (note.type === 'hold' && note.hit) {
                    // console.log('holding');
                    if (note.holdingStartTime === 0)
                        note.holdingStartTime = performance.now();
                    note.holdingTime += performance.now() - note.holdingStartTime
                    note.holdingStartTime = performance.now();

                }

            }

        }
        // requestAnimationFrame(this.drawMusicNote); // do it again
    }

    // startCountDown = () => {
    //     if (!this.isCountDownStarted) {
    //         // countDownSound.play()
    //         this.isCountDownStarted = true;
    //         $(counter).show()
    //         $(infoText).show()
    //         $(poseLogoImg).hide()

    //         bar.animate(1.0, { duration: countDownTime * 1000 }, () => {
    //         })

    //         countDownTimer = setInterval(() => {
    //             countDownTime -= 1;
    //             switch (countDownTime) {
    //                 //start 
    //                 case 0:

    //                     $(counter).hide()
    //                     bar.destroy()
    //                     infoText.innerHTML = 'Go!'
    //                     this.startGame()

    //                     break;
    //                 //times up
    //                 case -1:
    //                     clearInterval(countDownTimer)
    //                     $(infoText).hide()

    //                     countDownTime = 5;
    //                     break;
    //                 default:
    //                     infoText.innerHTML = countDownTime;
    //                     break;
    //             }

    //         }, 1000)

    //     }
    //     if (stopCountDownTimer) {
    //         clearTimeout(stopCountDownTimer)
    //         stopCountDownTimer = null
    //     }
    // }


    // stopCountDown = () => {

    //     if (this.isCountDownStarted && !stopCountDownTimer) {
    //         stopCountDownTimer = setTimeout(() => {

    //             clearTimeout(stopCountDownTimer)
    //             stopCountDownTimer = null
    //             clearInterval(countDownTimer)
    //             $(counter).hide()
    //             $(infoText).hide()
    //             $(poseLogoImg).show()
    //             this.isCountDownStarted = false;
    //             infoText.innerHTML = 5
    //             countDownTime = 5;
    //             bar.stop()
    //             bar.set(0)
    //         }, 500)
    //     }
    // }

    endGame = () => {
        if (this.music.duration > 0 && !this.music.paused) {
            this.music.pause();
            this.music.currentTime = 0;
        }
        // fetch('./result', {
        //     method: 'POST', // or 'PUT'
        //     headers: {
        //         'Content-Type': 'application/json',
        //     },
        //     body: JSON.stringify({
        //         score: this.score,
        //         name: this.playerName,
        //     }),
        // }).then(r => {
        //     window.location.href = `./result?type=${this.type}&score=${this.score}&player=${this.playerName}`
        // })
    }

    initPoints = () => {
        switch (this.type) {

            case "maimai":

                const boxCount = 8;

                let startPoint = this.rotate(.5, .5, .9, .5, 67.5, true)
                for (var i = 0; i < boxCount; i++) {

                    var newPoint = this.rotate(.5, .5, startPoint.x, startPoint.y, 45 * i)

                    this.reactionPoints.push(this.generateFixedReactionPoints(newPoint.x, newPoint.y, i));
                }
                this.music.muted = false

                break;
            default:
                break;
        }
    }

    generateFixedReactionPoints = (x: number, y: number, i: number) => {
        return new ActionPoint(this.canvas, "maimai", x, y, this.kill, i, this.config)
    }

    drawActionPoints = () => {
        if (this.reactionPoints.length > 0) {
            this.reactionPoints.forEach(element => { element.draw() });
        }
    }

    rotate = (cx: number, cy: number, x: number, y: number, angle: number, anticlock_wise = false) => {
        if (angle == 0) {
            return { x: x, y: y };
        } if (anticlock_wise) {
            var radians = (Math.PI / 180) * angle;
        } else {
            var radians = (Math.PI / -180) * angle;
        }
        var cos = Math.cos(radians);
        var sin = Math.sin(radians);
        var nx = (cos * (x - cx)) + (sin * (y - cy)) + cx;
        var ny = (cos * (y - cy)) - (sin * (x - cx)) + cy;
        return { x: nx, y: ny };
    }
    // collisionDetection = () => {
    //     //reaction music game
    //     if (this.type === "reaction_music_game") {
    //         // if (!this.checkBodyInScreen()) return
    //         this.reactionPoints.forEach((k, i) => {

    //             if (
    //                 // k.isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
    //                 // k.isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
    //                 k.isCollide(this.poseLandmarks[17]) ||
    //                 k.isCollide(this.poseLandmarks[18]) ||
    //                 k.isCollide(this.poseLandmarks[19]) ||
    //                 k.isCollide(this.poseLandmarks[20]) ||
    //                 k.isCollide(this.poseLandmarks[21]) ||
    //                 k.isCollide(this.poseLandmarks[22]) ||
    //                 k.isCollide(this.poseLandmarks[32]) ||
    //                 k.isCollide(this.poseLandmarks[31])) {


    //                 let c = this.checkReactionTime(i + 1)
    //                 k.onTouch(c)
    //                 // k.fadeOut();
    //             }
    //         }
    //         );

    //     }
    // }





    // checkBodyInScreen = () => {
    //     let requiredPoints = [0, 16, 15, 27, 28];
    //     return this.checkRequiredPoints(requiredPoints);
    // }



    // checkRequiredPoints = (points) => {
    //     for (var i = 0; i < points.length; i++) {

    //         if (!this.poseLandmarks[points[i]]
    //             || this.poseLandmarks[points[i]].x < 0
    //             || this.poseLandmarks[points[i]].y < 0
    //             || this.poseLandmarks[points[i]].x > 1
    //             || this.poseLandmarks[points[i]].y > 1) {

    //             return false;
    //         }

    //     }
    //     return true;
    // }



    // checkPointInRect = (point, x, y, dx, dy) => {
    //     return !(point.x * this.canvas.width < x
    //         || (point.x * this.canvas.width > x + dx)
    //         || point.y * this.canvas.height < y
    //         || (point.y * this.canvas.height > y + dy))

    // }

    // checkBodyInStartingRect = (poseLandmarks, successCallback, failCallback) => {

    //     canvasCtx.beginPath();
    //     canvasCtx.lineWidth = "1";
    //     canvasCtx.strokeStyle = primaryColor;

    //     // successCallback()
    //     // return
    //     if (poseLandmarks && poseLandmarks.length > 0) {

    //         // check T Pose
    //         if (this.type === 'reaction_music_game') {

    //             if (Math.abs(poseLandmarks[12].y - poseLandmarks[16].y) > 0.05) {
    //                 failCallback()
    //                 return
    //             }
    //             if (!(poseLandmarks[12].x > poseLandmarks[14].x > poseLandmarks[16].x)) {
    //                 failCallback()
    //                 return
    //             }
    //             if (Math.abs(poseLandmarks[15].y - poseLandmarks[11].y) > 0.05) {
    //                 failCallback()
    //                 return
    //             }
    //             if (!(poseLandmarks[15].x > poseLandmarks[13].x > poseLandmarks[11].x)) {
    //                 failCallback()
    //                 return
    //             }
    //         }
    //     }
    //     successCallback();

    // }
    ontouchstart = (e: React.TouchEvent<HTMLCanvasElement>) => {


        if (!this.isStarted) return
        const clientRect = this.canvasElement.getBoundingClientRect()
        for (let j = 0; j < e.targetTouches.length; j++) {
            this.reactionPoints.forEach((k, i) => {
                if ((k.isCollide({ x: (e.targetTouches[j].clientX - clientRect.left) / this.canvas.width, y: (e.targetTouches[j].clientY - clientRect.top) / this.canvas.height }))) {
                    let c = this.checkReactionTime(i + 1)
                    k.onTouch(c)
                }
            });
        }

    }
    ontouchmove = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!this.isStarted) return
        const clientRect = this.canvasElement.getBoundingClientRect()
        for (let j = 0; j < e.changedTouches.length; j++) {
            this.reactionPoints.forEach((k, i) => {
                if ((k.isCollide({ x: (e.changedTouches[j].clientX - clientRect.left) / this.canvas.width, y: (e.changedTouches[j].clientY - clientRect.top) / this.canvas.height }))) {
                    let c = this.checkReactionTime(i + 1)
                    k.onTouch(c)
                }
            });
        }

    }
    ontouchend = (e: React.TouchEvent<HTMLCanvasElement>) => {
        if (!this.isStarted) return
        const clientRect = this.canvasElement.getBoundingClientRect()
        for (let j = 0; j < e.changedTouches.length; j++) {
            this.reactionPoints.forEach((k, i) => {
                if ((k.isCollide({ x: (e.changedTouches[j].clientX - clientRect.left) / this.canvas.width, y: (e.changedTouches[j].clientY - clientRect.top) / this.canvas.height }))) {
                    if (k.musicNotes[0] && k.musicNotes[0].type === 'hold') {
                        k.musicNotes[0].hit = false
                        k.musicNotes[0].holdingStartTime = 0;
                    }

                }
            });
        }
    }
    kill = () => {
        this.reactionPoints = this.reactionPoints.filter((k, i) => k.alpha > 0)
    }
    startGame = () => {
        // scoreDiv.style.display = 'block'

        this.initPoints();


        this.isStarted = true;
        // this.poseLandmarks = [];
        this.score = 0;

        this.drawId = requestAnimationFrame(this.draw)




        // GAME_MUSIC.onended = () => {
        //     alert(`Score:${this.score}\nAccuracy:${(this.score / tscore * 100).toFixed(2)}%`)
        //     location.reload();
        // }

        this.preGenerateMusicNote()

        this.music.play().then(() => {
            this.scheuleMusicNote()

        }).catch((e => {
            alert(e)
        }));

    }

    onKeyboard = (e: KeyboardEvent) => {
        // keyborad
        // window.addEventListener('keydown', (e) => {
        if (!this.isStarted) return
        let s;
        switch (e.key) {


            case 'q':
                s = this.checkReactionTime(7)
                this.reactionPoints[6].onTouch(s)
                break;
            case 'w':
                s = this.checkReactionTime(8)
                this.reactionPoints[7].onTouch(s)
                break;
            case 'o':
                s = this.checkReactionTime(1)
                this.reactionPoints[0].onTouch(s)
                break;
            case 'p':
                s = this.checkReactionTime(2)
                this.reactionPoints[1].onTouch(s)
                break;
            case 'a':
                s = this.checkReactionTime(6)
                this.reactionPoints[5].onTouch(s)
                break;
            case 'c':
                s = this.checkReactionTime(5)
                this.reactionPoints[4].onTouch(s)
                break;
            case 'n':
                s = this.checkReactionTime(4)
                this.reactionPoints[3].onTouch(s)
                break;
            case 'l':
                s = this.checkReactionTime(3)
                this.reactionPoints[2].onTouch(s)
                break;
            default:
                break;
        }

        // }, false);
    }

    reset = () => {
        this.timerId.forEach(k => clearTimeout(k))
        this.timerId = []
        this.musicNotes = []
        this.reactionPoints = []
        this.score = 0
        this.isStarted = false
        this.music.pause()
        this.music.currentTime = 0;
        this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        cancelAnimationFrame(this.drawId)

    }


    draw = () => {
        const { RMG_CENTERLINE_RADIUS, RMG_OBJECT_RADIUS } = this.config
        // stats.begin();
        this.canvas.ctx.save();
        this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.canvas.ctx.beginPath()
        this.canvas.ctx.arc(.5 * this.canvas.width, .5 * this.canvas.height, RMG_CENTERLINE_RADIUS, 0, 2 * Math.PI);
        this.canvas.ctx.lineWidth = RMG_OBJECT_RADIUS * .1
        this.canvas.ctx.strokeStyle = 'white';
        this.canvas.ctx.stroke();
        this.canvas.ctx.closePath()

        this.update();
        this.canvas.ctx.restore()
        // stats.end();
        this.drawId = requestAnimationFrame(this.draw)
    }



    update = () => {
        this.drawActionPoints()
        this.drawMusicNote(performance.now())
    }



}



// function onResults(results) {
//     stats.begin();
//     canvasCtx.save();
//     canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
//     if (results.segmentationMask) {
//         canvasCtx.drawImage(
//             results.segmentationMask, 0, 0, this.canvas.width,
//             this.canvas.height);
//     }

//     // Only overwrite existing pixels.
//     canvasCtx.globalCompositeOperation = 'source-out';
//     // canvasCtx.fillStyle = '#00FF00';
//     // canvasCtx.globalAlpha = 0.3
//     if (results.segmentationMask)
//         canvasCtx.drawImage(backGround, 0, 0, this.canvas.width, this.canvas.height);
//     // canvasCtx.globalAlpha = 1
//     // Only overwrite missing pixels.
//     canvasCtx.globalCompositeOperation = 'destination-atop';
//     canvasCtx.drawImage(
//         results.image, 0, 0, this.canvas.width, this.canvas.height);

//     canvasCtx.globalCompositeOperation = 'source-over';

//     if (shouldDrawLandMank) {
//         drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
//             { color: '#00FF00', lineWidth: 4 });
//         drawLandmarks(canvasCtx, results.poseLandmarks,
//             { color: '#FF0000', lineWidth: 2 });
//     }
//     canvasCtx.beginPath()
//     canvasCtx.arc(.5 * this.canvas.width, .5 * this.canvas.height, RMG_CENTERLINE_RADIUS, 0, 2 * Math.PI);
//     canvasCtx.lineWidth = RMG_OBJECT_RADIUS * .1
//     canvasCtx.strokeStyle = 'white';
//     canvasCtx.stroke();
//     canvasCtx.closePath()


//     game.update(results.poseLandmarks);
//     canvasCtx.restore();
//     stats.end();


// }


// function toTuple({ y, x }) {
//     return [y, x];
// }
// function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
//     ctx.beginPath();
//     ctx.moveTo(ax * scale, ay * scale);
//     ctx.lineTo(bx * scale, by * scale);
//     ctx.lineWidth = 4;
//     ctx.strokeStyle = "green";
//     ctx.stroke();
// }
// function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
//     const adjacentKeyPoints =
//         posenet.getAdjacentKeyPoints(keypoints, minConfidence);

//     adjacentKeyPoints.forEach((keypoints) => {
//         drawSegment(
//             toTuple(keypoints[0].position), toTuple(keypoints[1].position), "green",
//             scale, ctx);
//     });
// }
// function drawPoint(ctx, y, x, r, color) {
//     ctx.beginPath();
//     ctx.arc(x, y, r, 0, 2 * Math.PI);
//     ctx.fillStyle = color;
//     ctx.fill();
// }
// function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
//     for (let i = 0; i < keypoints.length; i++) {
//         const keypoint = keypoints[i];
//         if (keypoint.score < minConfidence) {
//             continue;
//         }
//         const { y, x } = keypoint.position;
//         drawPoint(ctx, y * scale, x * scale, 10, "red");

//     }
// }
