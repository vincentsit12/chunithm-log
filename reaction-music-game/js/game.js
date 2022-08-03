const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const musicGameCanvasElement = document.getElementsByClassName('game_canvas')[0];

const canvasCtx = canvasElement.getContext('2d');
const musicGameCanvasCtx = musicGameCanvasElement.getContext('2d')
const poseLogoImg = document.getElementById('pose-logo')
//text component
const statusText = document.getElementById("status");
const scoreDiv = document.querySelector('#score')
const scoreText = document.querySelector('#score > div > div')
const errorText = document.getElementById("error");
const classificationText = document.getElementById("classification");
const startButton = document.getElementById("startButton");
const infoText = document.getElementById('info')
const timerText = document.querySelector('#timer > div > div')
const counter = document.getElementById('counter')
//global variable
const primaryColor = 'red'
const timeLimit = 60
var countDownTime = 5;
var countDownTimer, stopCountDownTimer;

//sound effect
// const successSound = new Audio("popSound.mp3")
// const countDownSound = new Audio('countdown.mp3')

//image
const backGround = new Image()
backGround.src = './img/led.jpg'

const vw = window.innerWidth;
const vh = window.innerHeight;
const vmax = (vw > vh ? vw : vh);
const vmin = (vw > vh ? vh : vw);
canvasElement.width = vw
canvasElement.height = vh
musicGameCanvasElement.width = vw
musicGameCanvasElement.height = vh
videoElement.width = vw
videoElement.height = vh
const parseQueryString = (search) =>
    (search || '')
        .replace(/^\?/g, '')
        .split('&')
        .reduce((acc, query) => {
            const [key, value] = query.split('=');

            if (key) {
                acc[key] = decodeURIComponent(value);
            }

            return acc;
        }, {});


//game setting
const GAME_MUSIC = new Audio("fragrance.mp3")
const BPM = 180
const SPEED = parseQueryString(window.location.search).s || 4
const DURATION = 4000 / SPEED
GAME_MUSIC.volume = .5
GAME_MUSIC.muted = true
GAME_MUSIC.load()
startButton.style.display = 'none';
GAME_MUSIC.oncanplaythrough = () => {
    // if (MODE === 'TOUCH')
    startButton.style.display = 'block';

}
const RMG_CENTERLINE_RADIUS = vmin * .4;
const RMG_OBJECT_RADIUS = RMG_CENTERLINE_RADIUS * .1;
var timeline;
switch (parseQueryString(window.location.search).d) {

    case 'hard':
        timeline = [["3", "2", "1", "0", "3", "4", "0", "6"], ["5", "0", "7", "8", "0", "2", "3", "4"], ["6", "7", "8", "0", "6", "5", "0", "3"], ["4", "7", "82", "1", "7", "82", "3", "4"], ["3", "2", "1", "0", "3", "4", "0", "6"], ["5", "0", "7", "8", "0", "2", "3", "4"], ["6", "7", "8", "0", "61", "5", "0", "38"], ["4", "7", "82", "18", "7", "82", "37", "48"], ["18", "0", "7", "0", "2", "0", "8", "1", "0", "1", "8", "0", "2", "0", "8", "0"], ["3", "0", "7", "0", "4", "0", "6", "3", "0", "3", "6", "0", "4", "0", "6", "0"], ["3", "0", "4", "0", "3", "0", "6", "3", "0", "3", "7", "0", "2", "0", "8", "0"], ["1", "0", "6", "0", "3", "0", "6", "2", "0", "2", "6", "0", "4", "0", "6", "0"], ["3", "0", "6", "0", "2", "0", "8", "1", "8", "1", "8", "0", "3", "0", "1", "0"], ["4", "0", "6", "0", "3", "0", "5", "2", "0", "2", "6", "0", "1", "0", "7", "0"], ["2", "0", "6", "0", "8", "0", "6", "1", "6", "1", "6", "0", "5", "0", "3", "0"], ["4", "0", "3", "0", "6", "0", "2", "5", "0", "5", "1", "0", "7", "8", "1", "2"], ["8", "0", "7", "0", "2", "0", "6", "1", "0", "1", "5", "0", "8", "0", "4", "0"], ["1", "0", "6", "0", "2", "0", "5", "1", "6", "1", "5", "0", "1", "5", "1", "7"], ["18", "0", "6", "0", "3", "0", "6", "2", "0", "2", "7", "0", "8", "0", "6", "0"], ["1", "0", "5", "0", "2", "0", "5", "3", "4", "3", "5", "0", "4", "5", "6", "7"], ["68", "0", "2", "0", "8", "0", "2", "7", "0", "7", "3", "0", "6", "0", "4", "0"], ["6", "0", "2", "0", "7", "0", "1", "8", "2", "7", "3", "0", "5", "4", "6", "4"], ["53", "0", "7", "0", "2", "0", "6", "8", "0", "8", "5", "0", "2", "0", "8", "0"], ["3", "0", "6", "0", "4", "0", "5", "4", "6", "3", "7", "0", "2", "3", "4", "5"], ["67", "0", "5", "0", "7", "0", "6", "5", "6", "5", "6", "0", "5", "0", "3", "0"], ["1", "0", "3", "0", "5", "0", "4", "6", "4", "6", "4", "0", "3", "5", "3", "5"], ["36", "0", "7", "0", "1", "0", "6", "5", "6", "5", "6", "0", "5", "0", "7", "0"], ["4", "0", "1", "0", "3", "0", "4", "5", "4", "5", "4", "0", "7", "8", "1", "2"], ["13", "0", "5", "0", "7", "0", "6", "5", "6", "5", "4", "0", "5", "0", "3", "0"], ["1", "0", "3", "0", "5", "0", "6", "5", "6", "5", "4", "0", "3", "5", "3", "5"], ["36", "0", "7", "0", "1", "0", "6", "5", "6", "5", "4", "0", "5", "0", "7", "0"], ["4", "0", "1", "0", "3", "0", "4", "5", "4", "5", "6", "0", "6", "7", "8", "1"], ["2", "1", "2", "1", "2", "0", "7", "8", "7", "8", "7", "0", "1", "8", "1", "0"], ["6", "5", "6", "5", "6", "0", "3", "4", "3", "4", "3", "0", "5", "4", "5", "0"], ["4", "5", "4", "5", "4", "0", "5", "4", "5", "4", "5", "0", "3", "6", "3", "0"], ["7", "2", "7", "2", "7", "0", "2", "7", "2", "7", "2", "0", "8", "1", "8", "0"], ["2", "1", "2", "1", "2", "0", "7", "8", "7", "8", "7", "0", "1", "8", "1", "8"], ["3", "4", "3", "4", "3", "0", "6", "5", "6", "5", "6", "0", "4", "5", "4", "5"], ["3", "6", "3", "6", "3", "0", "7", "2", "7", "2", "7", "0", "1", "8", "1", "8"], ["3", "4", "3", "2", "3", "0", "5", "4", "5", "6", "5", "0", "6", "7", "8", "1"], ["28", "7", "3", "0", "6", "0", "4", "5", "3", "0", "8", "0", "2", "7", "3", "8"], ["2", "7", "2", "0", "8", "0", "1", "7", "8", "0", "3", "0", "7", "2", "6", "3"], ["54", "6", "4", "0", "7", "0", "4", "5", "3", "0", "7", "0", "5", "6", "4", "7"], ["3", "5", "4", "0", "7", "0", "5", "6", "3", "0", "7", "0", "6", "7", "8", "1"], ["27", "8", "1", "0", "8", "0", "2", "7", "3", "0", "6", "0", "5", "4", "6", "5"], ["7", "5", "6", "0", "1", "0", "8", "1", "7", "0", "2", "0", "6", "3", "5", "4"], ["53", "6", "4", "0", "7", "0", "1", "8", "2", "0", "6", "0", "1", "8", "1", "6"], ["1", "4", "2", "0", "6", "0", "3", "0", "5", "4", "5", "0", "4", "5", "6", "7"], ["8", "1", "8", "1", "8", "0", "72", "27", "18", "0", "0", "0", "8", "0", "0", "0"], ["2", "7", "1", "0", "8", "2", "8", "2", "7", "3", "7", "0", "4", "5", "3", "6"], ["7", "4", "8", "0", "2", "1", "2", "1", "3", "4", "3", "0", "6", "5", "7", "4"], ["6", "5", "6", "0", "4", "5", "4", "5", "3", "6", "3", "0", "6", "3", "7", "2"], ["8", "1", "8", "1", "7", "2", "7", "2", "6", "3", "6", "3", "5", "4", "5", "4"], ["6", "3", "7", "2", "8", "1", "7", "2", "8", "1", "7", "2", "8", "1", "7", "2"], ["6", "3", "5", "4", "5", "3", "6", "2", "5", "1", "6", "2", "7", "3", "8", "4"], ["7", "3", "6", "2", "5", "1", "4", "8", "37", "48", "51", "62", "37", "84", "15", "26"]]

        break;

    default:
        timeline = ["4/3h1h2", "8h1h4", "2", "0", "1", "0", "81", "0", "18", "0", "27", "0", "36", "0", "45", "0", "0", ["3", "0", "6", "0"], ["2", "0", "4", "0"], ["12", "0", "2", "0"], ["8", "3", "4", "0"], ["5", "0", "74", "0"], ["8", "0", "6", "0"], ["1", "0", "3", "0"], ["2", "7", "3", "0"], ["3", "0", "1", "0"], ["4", "0", "8", "0"], ["5", "0", "4", "0"], ["6", "1", "2", "0"], ["7", "0", "6", "0"], ["5", "0", "4", "0"], ["3", "0", "2", "0"], ["1", "2", "83", "0"], "1", "0", "8", "0", "2", "0", "7", "0", "0", ["23", "0", "0", "0"], ["1", "0", "24", "0"], ["8", "0", "0", "0"], ["71", "2", "4", "0"], ["6", "0", "0", "0"], ["5", "0", "1", "0"], ["43", "0", "0", "0"], ["3", "4", "2", "0"], ["2", "0", "1", "0"], ["8", "7", "6", "0"], ["5", "0", "4", "0"], ["3", "2", "1", "0"], ["5", "0", "2", "0"], ["6", "4", "7", "0"], ["7", "0", "4", "0"], ["7", "35", "1", "0"]]

        break;
}
let tscore = 0
let t = timeline.flat()
for (let i = 0; i <= t.length; i++) {
    if (parseInt(t[i]) > 9) {
        tscore += 2000;
    }
    else if (parseInt(t[i]) > 0) {
        tscore += 1000;
    }
}



//testing
const shouldDrawLandMank = false


class Game {
    constructor(type, playerName) {
        this.config;

        this.poseLandmarks = [];
        this.type = type;
        this.playerName = playerName || 'GUEST'

        this.width = vw
        this.height = vh
        //isStarted = game start
        this.isStarted = false;
        //isCountDownStarted = counting start
        this.isCountDownStarted = false;

        this.score = 0;
        //reaction game 
        this.reactionPoints = [];
        this.conePoints = [];
        this.hurdlePoints = [];
        this.isLeft = null;
        this.isMiddle = true;
        this.timer;

        //reaction music game
        this.musicNotes = []

        t
    }
    checkReactionTime = (index) => {
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
        scoreText.innerHTML = this.score
        return color
    }
    startGame = () => {
        scoreDiv.style.display = 'block'

        this.initPoints();


        this.isStarted = true;
        this.poseLandmarks = [];
        this.score = 0;

        requestAnimationFrame(this.drawMusicNote)
        //keyborad
        // window.addEventListener('keydown', (e) => {

        //     switch (e.key) {
        //         case 'e':
        //             this.checkReactionTime(7)
        //             break;
        //         case 'r':
        //             this.checkReactionTime(8)
        //             break;
        //         case 'u':
        //             this.checkReactionTime(1)
        //             break;
        //         case 'i':
        //             this.checkReactionTime(2)
        //             break;
        //         case 'd':
        //             this.checkReactionTime(6)
        //             break;
        //         case 'f':
        //             this.checkReactionTime(5)
        //             break;
        //         case 'j':
        //             this.checkReactionTime(4)
        //             break;
        //         case 'k':
        //             this.checkReactionTime(3)
        //             break;
        //         default:
        //             break;
        //     }
        // }, false);  

        window.ontouchstart = (e) => {
            for (let j = 0; j < e.targetTouches.length; j++) {
                this.reactionPoints.forEach((k, i) => {
                    if ((k.isCollide({ x: e.targetTouches[j].clientX / vw, y: e.targetTouches[j].clientY / vh }))) {
                        let c = this.checkReactionTime(i + 1)
                        k.onTouch(c)
                    }
                });
            }

        }
        window.ontouchmove = (e) => {

            for (let j = 0; j < e.targetTouches.length; j++) {
                this.reactionPoints.forEach((k, i) => {
                    if ((k.isCollide({ x: e.targetTouches[j].clientX / vw, y: e.targetTouches[j].clientY / vh }))) {
                        let c = this.checkReactionTime(i + 1)
                        k.onTouch(c)
                    }
                });
            }

        }
        window.ontouchend = (e) => {

            for (let j = 0; j < e.changedTouches.length; j++) {
                this.reactionPoints.forEach((k, i) => {
                    if ((k.isCollide({ x: e.changedTouches[j].clientX / vw, y: e.changedTouches[j].clientY / vh }))) {
                        if (k.musicNotes[0] && k.musicNotes[0].type === 'hold') {
                            k.musicNotes[0].hit = false
                            k.musicNotes[0].holdingStartTime = 0;
                        }

                    }
                });
            }

        }

        GAME_MUSIC.onended = () => {
            alert(`Score:${this.score}\nAccuracy:${(this.score / tscore * 100).toFixed(2)}%`)
            location.reload();
        }

        this.preGenerateMusicNote()

        GAME_MUSIC.play().then(() => {
            this.scheuleMusicNote()

        }).catch((e => {
            alert(e)
        }));

    }

    generateMusicNote = (notesString, i, j = 1, length = 1) => {
        let notePos = parseInt(notesString)
        if (notePos <= 0) return

        let time = 240 / BPM * 1000 * (i + 1) + 240 / BPM / length * j * 1000 - DURATION

        //tap-hold
        if (notesString.includes('/')) {
            let eachArray = notesString.split('/')

            let holdArray = eachArray[1].split('h')

            let holdDuration = 1 / parseInt(holdArray[1]) * parseInt(holdArray[2]) * 240 / BPM * 1000


            let reactionPoint = this.reactionPoints[parseInt(eachArray[1]) - 1]
            let deltaX = (reactionPoint.xInCanvs - (.5 * vw + (reactionPoint.xInCanvs - .5 * vw) / 4)) / DURATION
            let deltaY = (reactionPoint.yInCanvs - (.5 * vh + (reactionPoint.yInCanvs - .5 * vh) / 4)) / DURATION

            let reactionPoint2 = this.reactionPoints[notePos - 1]
            let deltaX2 = (reactionPoint2.xInCanvs - (.5 * vw + (reactionPoint2.xInCanvs - .5 * vw) / 4)) / DURATION
            let deltaY2 = (reactionPoint2.yInCanvs - (.5 * vh + (reactionPoint2.yInCanvs - .5 * vh) / 4)) / DURATION

            this.musicNotes.push(
                new MusicNote(Math.random(),
                    { index: parseInt(eachArray[1]), x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                    { type: 'hold', holdDuration: holdDuration, deltaX: deltaX, deltaY: deltaY, isEach: true, time: time }
                    , reactionPoint.killMusicNote))

            this.musicNotes.push(new MusicNote(Math.random(),
                { index: parseInt(notesString), x: reactionPoint2.xInCanvs, y: reactionPoint2.yInCanvs },
                { type: 'tap', deltaX: deltaX2, deltaY: deltaY2, isEach: true, time: time },
                reactionPoint2.killMusicNote))
        }

        //tap , hold , tap-tap
        else {
            if (notesString.includes('h')) {
                let holdArray = notesString.split('h')
                let holdDuration = 1 / parseInt(holdArray[1]) * parseInt(holdArray[2]) * 240 / BPM * 1000
                let reactionPoint = this.reactionPoints[notePos - 1]
                let deltaX = (reactionPoint.xInCanvs - (.5 * vw + (reactionPoint.xInCanvs - .5 * vw) / 4)) / DURATION
                let deltaY = (reactionPoint.yInCanvs - (.5 * vh + (reactionPoint.yInCanvs - .5 * vh) / 4)) / DURATION
                this.musicNotes.push(
                    new MusicNote(Math.random(),
                        { index: notePos, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { type: 'hold', holdDuration: holdDuration, deltaX: deltaX, deltaY: deltaY, isEach: false, time: time }
                        , reactionPoint.killMusicNote))
            }
            else if (notePos - 1 >= 0) {
                if (notePos - 1 > 9) {
                    let digit1 = Math.trunc(notePos / 10)
                    let digit2 = notePos % 10
                    let reactionPoint = this.reactionPoints[digit1 - 1]
                    let reactionPoint2 = this.reactionPoints[digit2 - 1]
                    let deltaX = (reactionPoint.xInCanvs - (.5 * vw + (reactionPoint.xInCanvs - .5 * vw) / 4)) / DURATION
                    let deltaY = (reactionPoint.yInCanvs - (.5 * vh + (reactionPoint.yInCanvs - .5 * vh) / 4)) / DURATION
                    let deltaX2 = (reactionPoint2.xInCanvs - (.5 * vw + (reactionPoint2.xInCanvs - .5 * vw) / 4)) / DURATION
                    let deltaY2 = (reactionPoint2.yInCanvs - (.5 * vh + (reactionPoint2.yInCanvs - .5 * vh) / 4)) / DURATION
                    this.musicNotes.push(new MusicNote(Math.random(),
                        { index: digit1, x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { type: 'tap', deltaX: deltaX, deltaY: deltaY, isEach: true, time: time }, reactionPoint.killMusicNote))
                    this.musicNotes.push(new MusicNote(Math.random(),
                        { index: digit2, x: reactionPoint2.xInCanvs, y: reactionPoint2.yInCanvs },
                        { type: 'tap', deltaX: deltaX2, deltaY: deltaY2, isEach: true, time: time }, reactionPoint2.killMusicNote))


                }
                else {
                    let reactionPoint = this.reactionPoints[parseInt(notesString) - 1]
                    let deltaX = (reactionPoint.xInCanvs - (.5 * vw + (reactionPoint.xInCanvs - .5 * vw) / 4)) / DURATION
                    let deltaY = (reactionPoint.yInCanvs - (.5 * vh + (reactionPoint.yInCanvs - .5 * vh) / 4)) / DURATION



                    this.musicNotes.push(new MusicNote(Math.random(),
                        { index: parseInt(notesString), x: reactionPoint.xInCanvs, y: reactionPoint.yInCanvs },
                        { type: 'tap', deltaX: deltaX, deltaY: deltaY, isEach: false, time: time }, reactionPoint.killMusicNote))

                }
            }
        }
    }
    preGenerateMusicNote = () => {
        for (let i = 0; i < timeline.length; i++) {
            if (Array.isArray(timeline[i])) {
                for (let j = 0; j < timeline[i].length; j++) {

                    // setTimeout(() => {
                    this.generateMusicNote(timeline[i][j], i, j, timeline[i].length)

                    // }, 240 / BPM * 1000 * (i + 1) + 240 / BPM / timeline[i].length * j * 1000 - DURATION);



                }
            }

            else {

                // setTimeout(() => {
                this.generateMusicNote(timeline[i], i)
                // }, 240 / BPM * 1000 * (i + 1) + 240 / BPM * 1000 - DURATION)

            }

        }
    }
    scheuleMusicNote = () => {

        this.musicNotes.forEach((k) => {
            setTimeout(() => {

                k.generateTime = performance.now()
                k.judgementTime = k.generateTime + k.duration
                if (k.type === 'hold') {
                    setTimeout(() => {
                        //reverse
                        console.log('reverse: ');
                        k.reached = false
                        k.reversed = true
                        // k.width = k.targetWidth
                        k.targetWidth = RMG_OBJECT_RADIUS * 2
                        k.startTime = null


                    }, k.holdDuration - DURATION)
                }
                else {
                    // setTimeout(() => {
                    //     this.reactionPoints[k.index - 1].answer_sound.currentTime = 0
                    //     this.reactionPoints[k.index - 1].answer_sound.play()
                    // }, DURATION)
                }
                this.reactionPoints[k.index - 1].musicNotes.push(k)

            }, k.actualTime)
        })
    }

    drawMusicNote = (time) => {
        musicGameCanvasCtx.clearRect(0, 0, vw, vh)

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
                            console.log('reached');
                            note.reached = true
                            note.width = note.targetWidth
                            note.draw(note.x, note.y, note.targetWidth);

                        }

                        if (note.reached && note.reversed) {

                            if (note.holdingTime >= note.holdDuration * 0.5) {
                                // console.log('perfect', reactionTime);
                                this.score += 1000
                                this.reactionPoints[i].showJudgement('PERFECT', `rgba(255, 138, 6 ,%`)

                            }
                            else if (note.holdingTime >= note.holdDuration * 0.3) {
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
                                this.reactionPoints[i].showJudgement('MISS', `rgba(115, 115, 115  ,%`)

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
        requestAnimationFrame(this.drawMusicNote); // do it again
    }

    startCountDown = () => {
        if (!this.isCountDownStarted) {
            // countDownSound.play()
            this.isCountDownStarted = true;
            $(counter).show()
            $(infoText).show()
            $(poseLogoImg).hide()

            bar.animate(1.0, { duration: countDownTime * 1000 }, () => {
            })

            countDownTimer = setInterval(() => {
                countDownTime -= 1;
                switch (countDownTime) {
                    //start 
                    case 0:

                        $(counter).hide()
                        bar.destroy()
                        infoText.innerHTML = 'Go!'
                        this.startGame()

                        break;
                    //times up
                    case -1:
                        clearInterval(countDownTimer)
                        $(infoText).hide()

                        countDownTime = 5;
                        break;
                    default:
                        infoText.innerHTML = countDownTime;
                        break;
                }

            }, 1000)

        }
        if (stopCountDownTimer) {
            clearTimeout(stopCountDownTimer)
            stopCountDownTimer = null
        }
    }


    stopCountDown = () => {

        if (this.isCountDownStarted && !stopCountDownTimer) {
            stopCountDownTimer = setTimeout(() => {

                clearTimeout(stopCountDownTimer)
                stopCountDownTimer = null
                clearInterval(countDownTimer)
                $(counter).hide()
                $(infoText).hide()
                $(poseLogoImg).show()
                this.isCountDownStarted = false;
                infoText.innerHTML = 5
                countDownTime = 5;
                bar.stop()
                bar.set(0)
            }, 500)
        }
    }

    endGame = () => {
        if (GAME_MUSIC.duration > 0 && !GAME_MUSIC.paused) {
            GAME_MUSIC.pause();
            GAME_MUSIC.currentTime = 0;
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

            case "reaction_music_game":

                const boxCount = 8;

                let startPoint = rotate(.5, .5, .9, .5, 67.5, true)
                for (var i = 0; i < boxCount; i++) {

                    var newPoint = rotate(.5, .5, startPoint.x, startPoint.y, 45 * i)

                    this.reactionPoints.push(this.generateFixedReactionPoints(newPoint.x, newPoint.y, i));
                }
                GAME_MUSIC.muted = false

                break;
            default:
                break;
        }
    }
    update = (poseLandmarks) => {
        if (MODE === 'TOUCH') {
            if (!this.isStarted) {
                this.startGame()
            }
            this.drawActionPoints()
        }
        else {
            if (!this.isCountDownStarted) {
                if (poseLandmarks) {
                    drawBodyRect(poseLandmarks, canvasCtx)
                }
            }

            if (!this.isStarted) {
                this.poseLandmarks = poseLandmarks;
                this.checkBodyInStartingRect(poseLandmarks,
                    this.startCountDown, this.stopCountDown);
            }
            //------ started
            else {
                //draw collision points, can be null
                this.drawActionPoints();
                this.poseLandmarks = poseLandmarks;
                if (poseLandmarks && poseLandmarks.length > 0) {
                    // const shouldClassify = this.checkBodyInScreen()

                    this.collisionDetection();


                }

                scoreText.innerHTML = `${this.score}`;

            }
        }


    }

    generateFixedReactionPoints = (x, y, i) => {
        return new ActionPoint("reaction_music_game", x, y, this.kill, i)
    }

    drawActionPoints = () => {
        if (this.reactionPoints.length > 0) {
            this.reactionPoints.forEach(element => { element.draw() });
        } else if (this.conePoints.length === 2) {
            this.conePoints.forEach(element => element.draw());
        } else if (this.hurdlePoints.length === 2) {
            this.hurdlePoints.forEach(element => element.draw());
        }

    }

    collisionDetection = () => {
        //reaction music game
        if (this.type === "reaction_music_game") {
            // if (!this.checkBodyInScreen()) return
            this.reactionPoints.forEach((k, i) => {

                if (
                    // k.isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
                    // k.isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
                    k.isCollide(this.poseLandmarks[17]) ||
                    k.isCollide(this.poseLandmarks[18]) ||
                    k.isCollide(this.poseLandmarks[19]) ||
                    k.isCollide(this.poseLandmarks[20]) ||
                    k.isCollide(this.poseLandmarks[21]) ||
                    k.isCollide(this.poseLandmarks[22]) ||
                    k.isCollide(this.poseLandmarks[32]) ||
                    k.isCollide(this.poseLandmarks[31])) {


                    let c = this.checkReactionTime(i + 1)
                    k.onTouch(c)
                    // k.fadeOut();
                }
            }
            );

        }

    }





    checkBodyInScreen = () => {
        let requiredPoints = [0, 16, 15, 27, 28];
        return this.checkRequiredPoints(requiredPoints);
    }



    checkRequiredPoints = (points) => {
        for (var i = 0; i < points.length; i++) {

            if (!this.poseLandmarks[points[i]]
                || this.poseLandmarks[points[i]].x < 0
                || this.poseLandmarks[points[i]].y < 0
                || this.poseLandmarks[points[i]].x > 1
                || this.poseLandmarks[points[i]].y > 1) {

                return false;
            }

        }
        return true;
    }



    checkPointInRect = (point, x, y, dx, dy) => {
        return !(point.x * this.width < x
            || (point.x * this.width > x + dx)
            || point.y * this.height < y
            || (point.y * this.height > y + dy))

    }

    checkBodyInStartingRect = (poseLandmarks, successCallback, failCallback) => {

        canvasCtx.beginPath();
        canvasCtx.lineWidth = "1";
        canvasCtx.strokeStyle = primaryColor;

        // successCallback()
        // return
        if (poseLandmarks && poseLandmarks.length > 0) {

            // check T Pose
            if (this.type === 'reaction_music_game') {

                if (Math.abs(poseLandmarks[12].y - poseLandmarks[16].y) > 0.05) {
                    failCallback()
                    return
                }
                if (!(poseLandmarks[12].x > poseLandmarks[14].x > poseLandmarks[16].x)) {
                    failCallback()
                    return
                }
                if (Math.abs(poseLandmarks[15].y - poseLandmarks[11].y) > 0.05) {
                    failCallback()
                    return
                }
                if (!(poseLandmarks[15].x > poseLandmarks[13].x > poseLandmarks[11].x)) {
                    failCallback()
                    return
                }
            }
        }
        successCallback();

    }
}

kill = () => {
    this.reactionPoints = this.reactionPoints.filter((k, i) => k.alpha > 0)
}



/**
 @ActionPoint
 game object 
 * */
class ActionPoint {
    constructor(type, x, y, kill, index) {
        this.type = type;
        this.x = (vw > vh ? normalize(x) : x);
        this.y = (vh > vw ? normalize(y) : y);
        this.radius = RMG_OBJECT_RADIUS / 3.5
        this.xInCanvs = this.x * vw;
        this.yInCanvs = this.y * vh;
        this.alpha = .5;
        this.textAlpha = 1;
        this.text = '';
        this.textColor = 'white'

        this.onTouchColor = 'rgba(255,255,255,%)'
        this.onTouched = false

        this.timer = null;
        this.kill = kill;
        // this.answer_sound = new Audio('click.mp3')

        // this.answer_sound.volume = 1

        //reaction music game
        this.onHitTimer = null;
        this.outerRadius = null;

        this.musicNotes = [];

        this.index = index;

    }
    killMusicNote = (id) => {
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
    showJudgement = (text, color) => {
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
    onTouch = (color) => {
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

    isCollide(poseLandmark) {
        const { x, y } = poseLandmark
        const canvasX = x * vw
        const canvasY = y * vh
        if (this.type === "reaction_music_game") {
            return !(
                (canvasX < (this.xInCanvs - RMG_OBJECT_RADIUS * 3)) ||
                (canvasX > (this.xInCanvs + RMG_OBJECT_RADIUS * 3)) ||
                (canvasY < (this.yInCanvs - RMG_OBJECT_RADIUS * 3)) ||
                (canvasY > (this.yInCanvs + RMG_OBJECT_RADIUS * 3))
            );
        }
        return !(
            (canvasX < (this.xInCanvs - this.width / 2)) ||
            (canvasX > (this.xInCanvs + this.width / 2)) ||
            (canvasY < (this.yInCanvs - this.height)) ||
            (canvasY > (this.yInCanvs))
        );

    }

    checkBoxCollide(box1, box2) {

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
        switch (this.type) {
            case "reaction_music_game":

                if (this.text) {
                    canvasCtx.beginPath();
                    canvasCtx.setTransform(1, 0, 0, 1, this.xInCanvs - (this.xInCanvs - vw / 2) / 5, this.yInCanvs - (this.yInCanvs - vh / 2) / 5);
                    canvasCtx.rotate((22.5 + (this.index * 45)) * Math.PI / 180);
                    canvasCtx.font = `bold ${RMG_OBJECT_RADIUS}px Arial`;
                    canvasCtx.textAlign = "center";
                    canvasCtx.lineWidth = 2;
                    canvasCtx.strokeStyle = `rgba(255,255,255 ,${this.textAlpha})`
                    canvasCtx.strokeText(this.text, 0, 0);
                    canvasCtx.fillStyle = this.textColor.replace('%', this.textAlpha);
                    canvasCtx.fillText(this.text, 0, 0);
                    canvasCtx.setTransform(1, 0, 0, 1, 0, 0);
                    canvasCtx.closePath()
                }
                if (this.onTouched) {
                    canvasCtx.beginPath();
                    canvasCtx.fillStyle = this.onTouchColor.replace('%', this.alpha);

                    canvasCtx.arc(this.xInCanvs, this.yInCanvs, this.radius * 3, 0, 2 * Math.PI);
                    canvasCtx.fill();
                    canvasCtx.closePath()
                }

                canvasCtx.beginPath();
                canvasCtx.arc(this.xInCanvs, this.yInCanvs, this.radius, 0, 2 * Math.PI);

                // canvasCtx.arc(this.xInCanvs, this.yInCanvs, RMG_OBJECT_RADIUS / 3.5, 0, 2 * Math.PI);

                canvasCtx.fillStyle = `rgba(255,255,255,1)`;
                canvasCtx.fill();
                canvasCtx.closePath()
                // canvasCtx.lineWidth = this.radius * .3
                // canvasCtx.strokeStyle = 'black'
                // canvasCtx.stroke();
                // canvasCtx.closePath();

                break;

            default:
                break;
        }

    }

}

/** 
 *@MusicNote
 * */
class MusicNote {
    constructor(id, reactionPoint, noteInfo, kill) {
        this.id = id
        this.x = .5 * vw + (reactionPoint.x - .5 * vw) / 4;
        this.y = .5 * vh + (reactionPoint.y - .5 * vh) / 4;
        this.type = noteInfo.type || 'tap'


        this.targetX = reactionPoint.x + noteInfo.deltaX * 200
        this.targetY = reactionPoint.y + noteInfo.deltaY * 200

        this.targetWidth = .4 * vmin - .4 * vmin / 4 + RMG_OBJECT_RADIUS * 2
        this.index = reactionPoint.index


        this.radius = RMG_OBJECT_RADIUS;

        this.kill = kill;
        this.startTime = null;
        this.duration = DURATION;


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

    draw = (x, y, width, visible = true) => {
        // musicGameCanvasCtx.globalCompositeOperation = 'destination-atop'


        musicGameCanvasCtx.lineWidth = this.radius * .4

        if (!visible) {
            musicGameCanvasCtx.strokeStyle = 'transparent';
        }
        else {

            if (this.isEach) {
                musicGameCanvasCtx.fillStyle = 'rgba(255,255,0 ,.5)';
                musicGameCanvasCtx.strokeStyle = 'yellow';
            }
            else {
                musicGameCanvasCtx.fillStyle = 'rgba(255,0,255 ,.5)';
                musicGameCanvasCtx.strokeStyle = 'red';
            }
        }


        if (this.type === 'hold') {
            musicGameCanvasCtx.beginPath();
            musicGameCanvasCtx.setTransform(1, 0, 0, 1, vw / 2, vh / 2);
            if (!this.reversed) {

                musicGameCanvasCtx.rotate((-67.5 + 45 * (this.index - 1)) * Math.PI / 180);
                roundRect(musicGameCanvasCtx, .4 * vmin * .25 - RMG_OBJECT_RADIUS, - RMG_OBJECT_RADIUS, width, RMG_OBJECT_RADIUS * 2, RMG_OBJECT_RADIUS, false, true);
            } else {
                musicGameCanvasCtx.rotate(((-67.5 + 45 * (this.index - 1) + 180)) * Math.PI / 180);
                roundRect(musicGameCanvasCtx, -1 * (.4 * vmin + RMG_OBJECT_RADIUS), -RMG_OBJECT_RADIUS, width, RMG_OBJECT_RADIUS * 2, RMG_OBJECT_RADIUS, false, true);
            }
            musicGameCanvasCtx.setTransform(1, 0, 0, 1, 0, 0);
            musicGameCanvasCtx.closePath();


        }
        else {
            musicGameCanvasCtx.beginPath();
            musicGameCanvasCtx.arc(x, y, RMG_OBJECT_RADIUS / 7, 0, 2 * Math.PI);
            musicGameCanvasCtx.fill();
            musicGameCanvasCtx.closePath();

            musicGameCanvasCtx.beginPath();
            musicGameCanvasCtx.arc(x, y, this.radius, 0, 2 * Math.PI);
            musicGameCanvasCtx.stroke();
            musicGameCanvasCtx.closePath();
        }
        // musicGameCanvasCtx.globalAlpha = this.alpha
        // canvasCtx.fillStyle = `rgba(255,255,255,0)`;
        // canvasCtx.fill();



    }
}

function onResults(results) {
    stats.begin();
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, vw, vh);
    if (results.segmentationMask) {
        canvasCtx.drawImage(
            results.segmentationMask, 0, 0, vw,
            vh);
    }

    // Only overwrite existing pixels.
    canvasCtx.globalCompositeOperation = 'source-out';
    // canvasCtx.fillStyle = '#00FF00';
    // canvasCtx.globalAlpha = 0.3
    if (results.segmentationMask)
        canvasCtx.drawImage(backGround, 0, 0, vw, vh);
    // canvasCtx.globalAlpha = 1
    // Only overwrite missing pixels.
    canvasCtx.globalCompositeOperation = 'destination-atop';
    canvasCtx.drawImage(
        results.image, 0, 0, vw, vh);

    canvasCtx.globalCompositeOperation = 'source-over';

    if (shouldDrawLandMank) {
        drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
            { color: '#00FF00', lineWidth: 4 });
        drawLandmarks(canvasCtx, results.poseLandmarks,
            { color: '#FF0000', lineWidth: 2 });
    }
    canvasCtx.beginPath()
    canvasCtx.arc(.5 * vw, .5 * vh, RMG_CENTERLINE_RADIUS, 0, 2 * Math.PI);
    canvasCtx.lineWidth = RMG_OBJECT_RADIUS * .1
    canvasCtx.strokeStyle = 'white';
    canvasCtx.stroke();
    canvasCtx.closePath()


    game.update(results.poseLandmarks);
    canvasCtx.restore();
    stats.end();


}

function touchmode() {
    stats.begin();
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, vw, vh);
    canvasCtx.beginPath()
    canvasCtx.arc(.5 * vw, .5 * vh, RMG_CENTERLINE_RADIUS, 0, 2 * Math.PI);
    canvasCtx.lineWidth = RMG_OBJECT_RADIUS * .1
    canvasCtx.strokeStyle = 'white';
    canvasCtx.stroke();
    canvasCtx.closePath()

    game.update();
    canvasCtx.restore()
    stats.end();
    requestAnimationFrame(touchmode)
}

function init() {
    // $.getJSON('poseConfig.json', function (data) {
    // game.config = data[poseName];
    startButton.style.display = 'none';
    if (MODE === 'CAMERA') {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
            }
        });
        pose.setOptions({
            modelComplexity: 1,
            selfieMode: true,
            upperBodyOnly: false,
            smoothLandmarks: true,
            enableSegmentation: true,
            smoothSegmentation: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);

        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia;

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                // try {
                await pose.send({ image: videoElement });
                // }
                // catch (error) {
                //     statusText.innerHTML = error

                // }
            },
            facingMode: 'user',
            // width: vw,
            // height: vh,
        });
        camera.start();

    }
    else {
        requestAnimationFrame(touchmode)

    }
    // });
}




function toTuple({ y, x }) {
    return [y, x];
}
function drawSegment([ay, ax], [by, bx], color, scale, ctx) {
    ctx.beginPath();
    ctx.moveTo(ax * scale, ay * scale);
    ctx.lineTo(bx * scale, by * scale);
    ctx.lineWidth = 4;
    ctx.strokeStyle = "green";
    ctx.stroke();
}
function drawSkeleton(keypoints, minConfidence, ctx, scale = 1) {
    const adjacentKeyPoints =
        posenet.getAdjacentKeyPoints(keypoints, minConfidence);

    adjacentKeyPoints.forEach((keypoints) => {
        drawSegment(
            toTuple(keypoints[0].position), toTuple(keypoints[1].position), "green",
            scale, ctx);
    });
}
function drawPoint(ctx, y, x, r, color) {
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 2 * Math.PI);
    ctx.fillStyle = color;
    ctx.fill();
}
function drawKeypoints(keypoints, minConfidence, ctx, scale = 1) {
    for (let i = 0; i < keypoints.length; i++) {
        const keypoint = keypoints[i];
        if (keypoint.score < minConfidence) {
            continue;
        }
        const { y, x } = keypoint.position;
        drawPoint(ctx, y * scale, x * scale, 10, "red");

    }
}

function drawHand(keypoints, ctx) {
    if (keypoints.length <= 0) return
    const lRadius = Math.abs(keypoints[18].x - keypoints[20].x) * vw * 2.5
    const RRadius = Math.abs(keypoints[19].x - keypoints[17].x) * vw * 2.5

    ctx.beginPath();
    ctx.lineWidth = "3";
    ctx.arc((keypoints[18].x + keypoints[20].x) / 2 * vw, (keypoints[18].y + keypoints[20].y) / 2 * vh, lRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,0,255,0.7)';
    ctx.stroke();

    ctx.beginPath();
    ctx.lineWidth = "3";
    ctx.arc((keypoints[19].x + keypoints[17].x) / 2 * vw, (keypoints[19].y + keypoints[17].y) / 2 * vh, RRadius, 0, 2 * Math.PI);
    ctx.strokeStyle = 'rgba(255,0,255,0.7)';
    ctx.stroke();

}
function drawBodyRect(keypoints, ctx) {
    if (keypoints.length <= 0) return
    ctx.beginPath();
    ctx.lineWidth = "3";
    ctx.strokeStyle = primaryColor;
    const left = Math.min(keypoints[12].x, keypoints[32].x, keypoints[32].x, keypoints[0].x) * vw
    const right = Math.max(keypoints[11].x, keypoints[31].x, keypoints[32].x) * vw
    const top = Math.min(keypoints[4].y, keypoints[1].y) * vh
    const bottom = Math.max(keypoints[32].y, keypoints[31].y) * vh
    const xOffset = Math.abs(right - left) * 0.1
    const yOffset = Math.abs(bottom - top) * 0.1

    ctx.rect(left - xOffset, top - yOffset, Math.abs(right - left) + xOffset * 2, Math.abs(bottom - top) + yOffset * 2)
    ctx.stroke();

}
function twoPointsFormula(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y)
}

function rotate(cx, cy, x, y, angle, anticlock_wise = false) {
    if (angle == 0) {
        return { x: parseFloat(x), y: parseFloat(y) };
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

function toFixed(x) {
    if (Math.abs(x) < 1.0) {
        var e = parseInt(x.toString().split('e-')[1]);
        if (e) {
            x *= Math.pow(10, e - 1);
            x = '0.' + (new Array(e)).join('0') + x.toString().substring(2);
        }
    } else {
        var e = parseInt(x.toString().split('+')[1]);
        if (e > 20) {
            e -= 20;
            x /= Math.pow(10, e);
            x += (new Array(e + 1)).join('0');
        }
    }
    return x;
}
function toFixedTrunc(x, n) {
    x = toFixed(x)

    // From here on the code is the same than the original answer
    const v = (typeof x === 'string' ? x : x.toString()).split('.');
    if (n <= 0) return v[0];
    let f = v[1] || '';
    if (f.length > n) return `${v[0]}.${f.substr(0, n)}`;
    while (f.length < n) f += '0';
    return `${v[0]}.${f}`
}

function normalize(point) {
    return (vmin * point + (vmax - vmin) / 2) / vmax
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
function roundRect(ctx, x, y, width, height, radius, fill, stroke) {
    if (typeof stroke === 'undefined') {
        stroke = true;
    }
    if (typeof radius === 'undefined') {
        radius = 5;
    }
    if (typeof radius === 'number') {
        radius = { tl: radius, tr: radius, br: radius, bl: radius };
    } else {
        var defaultRadius = { tl: 0, tr: 0, br: 0, bl: 0 };
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
