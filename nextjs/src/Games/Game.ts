import { log } from "console"
import e from "cors"
import { YouTubeEvent } from "react-youtube"
import { ActionPoint } from "./ActionPoint"
import { MusicNote } from "./MusicNote"

export class Game {
    canvasElement: HTMLCanvasElement
    canvas: Canvas
    music: any
    type: GameType
    timeline: (string | string[])[]
    isStarted: boolean
    // isCountDownStarted: boolean
    score: number
    totalScore: number
    combo: number
    timer: any
    reactionPoints: ActionPoint[]
    musicNotes: MusicNote[]
    config: GameConfig
    timerId: any[]
    drawId: number
    constructor(
        canvas: HTMLCanvasElement,
        type: GameType,
        music: any,
        timeline: (string | string[])[],
        config: GameConfig
    ) {
        this.type = type;
        // this.poseLandmarks = [];
        // this.playerName = playerName || 'GUEST'
        this.canvasElement = canvas
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
        this.combo = 0;
        this.totalScore = 0;
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
        if (this.music instanceof HTMLAudioElement) {
            music.volume = .5
            // music.muted = true
            music.load()
        }
  
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
                this.combo++
                this.score += 500
                color = `rgba(255, 138, 6 ,%)`
                this.reactionPoints[_index].showJudgement('PERFECT', `rgba(255, 138, 6 ,%)`)
                this.reactionPoints[_index].killMusicNote(this.reactionPoints[_index].musicNotes[0].id)

            }
            else if (reactionTime <= 100) {
                this.reactionPoints[_index].musicNotes[0].hit = true
                // console.log('great', reactionTime);
                this.combo++
                this.score += 400
                color = `rgba(214, 78, 62 ,%)`
                this.reactionPoints[_index].showJudgement('GREAT', `rgba(214, 78, 62 ,%)`)
                this.reactionPoints[_index].killMusicNote(this.reactionPoints[_index].musicNotes[0].id)

            }
            else if (reactionTime >= 100 && reactionTime <= 150) {
                this.reactionPoints[_index].musicNotes[0].hit = true
                this.combo++
                this.score += 250
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
        const judgementPointCount = this.reactionPoints.length
        let notePos = parseInt(notesString)
        if (notePos <= 0) return

        let time = 240 / BPM * 1000 * (i + 1) + 240 / BPM / length * j * 1000 - DURATION

        //each tap-hold mix 
        if (notesString.includes('/')) {
            let notesArray = notesString.split('/')
            for (var i = 0; i < notesArray.length; i++) {
                let type: NoteType = notesArray[i].includes('h') ? 'hold' : 'tap'

                if (type === 'hold') {
                    let holdArray = notesArray[i].split('h')
                    let index = parseInt(holdArray[0]) % judgementPointCount || judgementPointCount
                    let reactionPoint = this.reactionPoints[index - 1]
                    let holdTimingArray = holdArray[1].split(':')
                    let holdDuration = 1 / parseInt(holdTimingArray[0]) * parseInt(holdTimingArray[1]) * 240 / BPM * 1000
                    this.musicNotes.push(
                        new MusicNote(this.canvas, Math.random(),
                            { index: index, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                            { gameType: this.type, type: type, holdDuration: holdDuration, isEach: true, time: time },
                            reactionPoint.killMusicNote, this.config))

                    this.totalScore += 1000
                }
                //each tap
                else {
                    let index = parseInt(notesArray[i]) % judgementPointCount || judgementPointCount
                    let reactionPoint = this.reactionPoints[index - 1]
                    this.musicNotes.push(
                        new MusicNote(this.canvas, Math.random(),
                            { index: index, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                            { gameType: this.type, type: type, isEach: true, time: time },
                            reactionPoint.killMusicNote, this.config))

                    this.totalScore += 500
                }


            }

        }

        //tap , hold , tap-tap
        else {
            //hold
            if (notesString.includes('h')) {
                let holdArray = notesString.split('h')
                let index = parseInt(holdArray[0]) % judgementPointCount || judgementPointCount
                let reactionPoint = this.reactionPoints[index - 1]
                let holdTimingArray = holdArray[1].split(':')
                let holdDuration = 1 / parseInt(holdTimingArray[0]) * parseInt(holdTimingArray[1]) * 240 / BPM * 1000
                this.musicNotes.push(
                    new MusicNote(this.canvas, Math.random(),
                        { index: index, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { gameType: this.type, type: 'hold', holdDuration: holdDuration, isEach: true, time: time },
                        reactionPoint.killMusicNote, this.config))
                this.totalScore += 1000
            }
            //each tap, tap
            else if (notePos - 1 >= 0) {
                let isEach = notesString.length > 1
                for (var i = 0; i < notesString.length; i++) {

                    let index = parseInt(notesString[i]) % judgementPointCount || judgementPointCount


                    let reactionPoint = this.reactionPoints[index - 1]


                    this.musicNotes.push(new MusicNote(this.canvas, Math.random(),
                        { index: index, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { gameType: this.type, type: 'tap', isEach: isEach, time: time },
                        reactionPoint.killMusicNote, this.config))
                    this.totalScore += 500
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
                        k.reached = false
                        k.reversed = true
                        // k.width = k.targetWidth
                        k.targetLength = this.type === 'maimai' ? RMG_OBJECT_RADIUS * 2 : 0
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

                var currentLength = note.length + ((note.targetLength - note.length) * judgementTime);
                if (note.type === 'hold') {
                    if (judgementTime >= 1) {

                        if (note.reached) {
                            note.draw(currentX, currentY, note.targetLength);
                        }
                        else {
                            // console.log('reached');
                            note.reached = true
                            note.length = note.targetLength
                            note.draw(note.x, note.y, note.targetLength);
                        }

                        if (note.reached && note.reversed) {

                            if (note.holdingTime >= note.holdDuration! * 0.5) {
                                // console.log('perfect', reactionTime);
                                this.combo++
                                this.score += 1000
                                this.reactionPoints[i].showJudgement('PERFECT', `rgba(255, 138, 6 ,%`)

                            }
                            else if (note.holdingTime >= note.holdDuration! * 0.3) {
                                // console.log('great', reactionTime);
                                this.combo++
                                this.score += 800
                                // this.reactionPoints[_index].changeColor('red')
                                this.reactionPoints[i].showJudgement('GREAT', `rgba(214, 78, 62 ,%`)

                            }
                            else if (note.holdingTime > 0) {
                                this.combo++
                                this.score += 500
                                this.reactionPoints[i].showJudgement('GOOD', `rgba(11, 250, 80 ,%`)
                            }
                            else if (note.holdingTime <= 0) {
                                this.combo = 0
                                this.reactionPoints[i].showJudgement('MISS', `rgba(115, 115, 115  ,%`)

                            }


                            note.kill(note.id);
                        }
                    }
                    else {
                        note.draw(currentX, currentY, currentLength);
                    }
                }

                else {
                    if (judgementTime >= 1) {
                        note.reached = true
                    }
                    if (deltaTime >= 1) { // note means we ended our animation
                        if (note.reached) {
                            if (!note.hit) {
                                this.combo = 0
                                this.reactionPoints[i].showJudgement('MISS', `rgba(115, 115, 115, %`)
                            }

                            // note.draw(note.x, note.y, false)

                            note.kill(note.id);

                        }
                    }
                    else {
                        note.draw(currentX, currentY, currentLength);
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
        if (this.music instanceof HTMLAudioElement) {
            if (this.music.duration > 0 && !this.music.paused) {
                this.music.pause();
                this.music.currentTime = 0;
            }
        }
        else {

        }
    }

    initPoints = () => {
        switch (this.type) {

            case "maimai":

                var boxCount = 8;

                var startPoint = this.rotate(.5, .5, .9, .5, 67.5, true)
                for (var i = 0; i < boxCount; i++) {

                    var newPoint = this.rotate(.5, .5, startPoint.x, startPoint.y, 45 * i)

                    this.reactionPoints.push(this.generateFixedReactionPoints(newPoint.x, newPoint.y, i));
                }
                // this.music.muted = false

                break;
            case "djmania":
                var boxCount = 4;
                let xStartPoint = ((this.canvas.width - this.canvas.vmin) / 2) / this.canvas.width
                let averageWidth = 1 / boxCount
                for (var i = 0; i < boxCount; i++) {
                    let x = averageWidth * (i + 0.5) * this.canvas.vmin / this.canvas.width
                    this.reactionPoints.push(this.generateFixedReactionPoints((xStartPoint + x), .9, i));
                }
                // this.music.muted = false

                break;
            default:
                break;
        }
    }

    generateFixedReactionPoints = (x: number, y: number, i: number) => {
        return new ActionPoint(this.canvas, this.type, x, y, this.kill, i, this.config)
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
        this.combo = 0;
        this.drawId = requestAnimationFrame(this.draw)




        // GAME_MUSIC.onended = () => {
        //     alert(`Score:${this.score}\nAccuracy:${(this.score / tscore * 100).toFixed(2)}%`)
        //     location.reload();
        // }

        this.preGenerateMusicNote()

        if (this.music instanceof HTMLAudioElement) {
            this.music.play().then(() => {
                this.scheuleMusicNote()

            }).catch((e => {
                alert(e)
            }));
        }
        else {
            this.music.playVideo()
            // this.scheuleMusicNote()
        }


    }

    checkKeyboardEvent = (e: KeyboardEvent, i: number) => {
        if (e.type === "keydown" && !e.repeat) {
            let color = this.checkReactionTime(i)
            this.reactionPoints[i - 1].onTouch(color)
        }
        else if (e.type === "keyup") {
            let note = this.reactionPoints[i - 1].musicNotes[0]
            if (note && note.type == 'hold') {
                note.hit = false
                note.holdingStartTime = 0;
            }
        }
    }

    onKeyboard = (e: KeyboardEvent) => {
        // keyborad
        // window.addEventListener('keydown', (e) => {
        if (!this.isStarted || this.type === 'maimai') return

        switch (e.key) {

            case 'z':
                this.checkKeyboardEvent(e, 1)
                break;
            case 'x':
                this.checkKeyboardEvent(e, 2)
                break;
            case '.':
                this.checkKeyboardEvent(e, 3)
                break;
            case '/':
                this.checkKeyboardEvent(e, 4)
                break;
            // case 'a':
            //     s = this.checkReactionTime(5)
            //     this.reactionPoints[4].onTouch(s)
            //     break;
            // case 'c':
            //     s = this.checkReactionTime(6)
            //     this.reactionPoints[5].onTouch(s)
            //     break;
            // case 'n':
            //     s = this.checkReactionTime(7)
            //     this.reactionPoints[6].onTouch(s)
            //     break;
            // case 'l':
            //     s = this.checkReactionTime(8)
            //     this.reactionPoints[7].onTouch(s)
            //     break;
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

        this.score = 0;
        this.combo = 0;
        this.totalScore = 0;

        this.isStarted = false
        if (this.music instanceof HTMLAudioElement) {
            this.music.pause()
            this.music.currentTime = 0;
        }
        else {
            this.music.pauseVideo()
            this.music.seekTo(0)
        }
        this.canvas.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        cancelAnimationFrame(this.drawId)

    }


    draw = () => {
        const { RMG_CENTERLINE_RADIUS, RMG_OBJECT_RADIUS } = this.config
        // stats.begin();
        const ctx = this.canvas.ctx
        ctx.save();
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        ctx.beginPath()

        //draw game field
        switch (this.type) {
            case 'maimai':
                ctx.strokeStyle = 'white';
                ctx.arc(.5 * this.canvas.width, .5 * this.canvas.height, RMG_CENTERLINE_RADIUS, 0, 2 * Math.PI);
                ctx.lineWidth = RMG_OBJECT_RADIUS * .1
                ctx.stroke();
                ctx.closePath()
                break;
            case 'djmania':

                ctx.strokeStyle = 'gray';
                const startPoint = (this.canvas.width - this.canvas.vmin) / 2
                for (var i = 0; i < 5; i++) {
                    ctx.moveTo(startPoint + (i * .25) * this.canvas.vmin, 0)
                    ctx.lineTo(startPoint + (i * .25) * this.canvas.vmin, this.canvas.height);
                }

                ctx.moveTo(startPoint, .9 * this.canvas.height)
                ctx.lineTo(startPoint + this.canvas.vmin, .9 * this.canvas.height);




                ctx.lineWidth = RMG_OBJECT_RADIUS * .1
                ctx.stroke();


                ctx.font = `bold ${RMG_OBJECT_RADIUS * 10}px Arial`;
                ctx.textAlign = "center";
                // ctx.lineWidth = 2;
                // ctx.strokeStyle = `rgba(255,255,255, 1})`
                // ctx.strokeText(this.combo.toString(), 0, 0);
                ctx.fillStyle = `rgba(255,255,255, .5)`
                ctx.fillText(this.combo.toString(), .5 * this.canvas.width, .25 * this.canvas.height);
                ctx.font = `bold ${RMG_OBJECT_RADIUS * 2}px Arial`;
                ctx.textAlign = "center";
                ctx.fillText(`  ${((this.score / this.totalScore) * 100).toFixed(2)}%`, .5 * this.canvas.width, RMG_OBJECT_RADIUS * 2.5);

                ctx.closePath()

                break;
            default:

                break;
        }


        //draw music note and judgement line
        this.update();

        ctx.restore()
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
