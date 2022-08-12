class PoseCounter {
    constructor(config, actionDetect) {
        this.config = config;
        this.actionCount = 0;
        this.recentAction;
        this.previousAction = '';
        this.score = 0;
        this.actionPos = 0;
        this.poseKeepingTime = 0;
        this.exceptionCount = 0;
        this.poseStartTime = 0;
        this.reversed = false
        this.poseLandmarks = [];
        this.leftHandLandmarks = [];
        this.rightHandLandmarks = [];
        this.previousPoseLandmarks = [];

        this.start = () => {

            this.actionList = this.config.action;

            this.reversedActionList = this.actionList.map((item) => {

                let index = this.config.reversible_pair.indexOf(item)
                if (index >= 0) {
                    return (this.config.reversible_pair[(index + 1) % 2])
                }
                else return item
            })
            console.log(' this.reversedActionList: ', this.reversedActionList);
        }

        this.resetAll = () => {
            this.actionPos = 0;
            // this.previousAction = '';
            this.poseKeepingTime = 0;
            this.poseStartTime = 0;
            this.exceptionCount = 0;
            this.recentAction = null;
            // this.reversed = false;
            this.previousAction = '';
            this.previousPoseLandmarks = [];
        }

        this.resetPoseAction = (success) => {
            this.actionPos = !success ? 0 : (this.actionPos + 1);
            this.poseKeepingTime = 0
            this.poseStartTime = 0
        }

        this.classify = () => {
            let actionList = this.reversed ? this.reversedActionList : this.actionList;
            // const exceptionLimit = posethis.config.exceptionLimit
            const reversiblePos = this.config.reversible_point
            //check action position and add score
            if (this.actionPos === actionList.length) {
                this.score++;
                // window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                scoreText.innerHTML = `score : ${this.score}`;
                successSound.play()
                this.resetAll();

            }
            let revisible = this.score < 1 || this.exceptionCount > 30
            actionDetect(this)

            classificationText.innerHTML = this.recentAction ?? "---------"
            errorText.innerHTML = 'error: ' + this.exceptionCount

            if (this.actionPos === reversiblePos && this.recentAction === this.reversedActionList[this.actionPos]
                && revisible) {
                console.log('reversed');
                this.reversed = true
                actionList = this.reversedActionList

            }

            //detect a new action in action queue
            if (this.recentAction === actionList[this.actionPos]) {
                if (this.recentAction !== this.previousAction) {
                    this.previousAction = actionList[this.actionPos]

                    if (this.config.classes[this.recentAction].time === 0) {
                        this.resetPoseAction(true)
                        statusText.innerHTML = 'next : ' + actionList[this.actionPos % actionList.length]
                    }

                    else
                        this.poseStartTime = new Date().getTime();
                }

                else if (this.recentAction === this.previousAction) {
                    var now = new Date().getTime()
                    if (this.poseStartTime > 0) {
                        this.poseKeepingTime += now - this.poseStartTime;
                        this.poseStartTime = now

                    }
                    if (this.poseKeepingTime > Math.abs(this.config.classes[this.recentAction].time) * 1000) {
                        this.resetPoseAction((this.config.classes[this.recentAction].time > 0))
                        // t>0
                        statusText.innerHTML = 'fulfil keeping timing'

                        // t<0
                        if (this.config.classes[this.recentAction].time < 0) {
                            statusText.innerHTML = 'pose keeping too long, restart the action'
                            this.actionPos = 0
                            this.previousAction = ""
                        }
                    }
                }
            }

            /*
                 when t > 0 , change pose with unexpected timing
                 when t < 0 , change pose immidiately
            */
            else if (this.recentAction !== actionList[this.actionPos] && this.poseStartTime > 0) {
                // t > 0 , true
                this.resetPoseAction(!(this.config.classes[actionList[this.actionPos]].time > 0))

                if (this.config.classes[this.recentAction].time <= 0) {
                    statusText.innerHTML = 'correct pose within time'
                }
                else {
                    statusText.innerHTML = 'incorrect pose with unexpected timing'
                }
            }



        }



        this.longestDistance = (poseLandmarks) => {
            var maxY = Math.max(poseLandmarks[32].y, poseLandmarks[31].y);
            var maxX = Math.max(poseLandmarks[32].x, poseLandmarks[31].x);
            const nose = poseLandmarks[0];
            return [Math.abs(maxX - nose.x), Math.abs(maxY - nose.y)]

        }
        this.findBodyAngle = (points) => {
            let angles = []
            for (let i = 0; i < points.length; i++) {
                angles.push(calculateAngle(points[i][0], points[i][1], points[i][2], this.poseLandmarks))

            }

            return angles
        }
    }


}

function findSlope(p1, p2) {

    console.log((p2.y - p1.y) / (p2.x - p1.x))
    return (p2.y - p1.y) / (p2.x - p1.x)
}
function cosineFormula(a, b, c) {
    return Math.acos((a * a + b * b - c * c) / (2 * a * b)) * 180 / Math.PI
}

function twoPointsFormula(a, b) {
    return Math.hypot(a.x - b.x, a.y - b.y)
}

function calculateAngle(p1, p2, p3, poseLandmarks) {
    let a, b, c
    if (poseLandmarks) {
        a = twoPointsFormula(poseLandmarks[p1], poseLandmarks[p2])
        b = twoPointsFormula(poseLandmarks[p1], poseLandmarks[p3])
        c = twoPointsFormula(poseLandmarks[p2], poseLandmarks[p3])
    }
    else {
        a = twoPointsFormula(p1, p2)
        b = twoPointsFormula(p1, p3)
        c = twoPointsFormula(p2, p3)
    }
    return cosineFormula(a, b, c)

}

