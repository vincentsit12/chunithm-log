const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
//text component
const statusText = document.getElementById("status");
const scoreText = document.getElementById("score");
const successSound = new Audio("popsound.mp3")

const videoWidth = window.innerWidth;
const videoHeight = window.innerHeight;
canvasElement.width = videoWidth
canvasElement.height = videoHeight
videoElement.width = videoWidth;
videoElement.height = videoHeight;
// canvasElement.width = videoWidth
// canvasElement.height = videoHeight
// const poseRectRatio = {
//     w: .5,
//     h: .9
// }
// const poseRect = {
//     left: canvasElement.width * (1 - poseRectRatio.w) / 2,
//     top: canvasElement.height * (1 - poseRectRatio.h) / 2,
//     bottom: canvasElement.height * (poseRectRatio.h + (1 - poseRectRatio.h) / 2),
//     right: canvasElement.width * (poseRectRatio.w + (1 - poseRectRatio.w) / 2),
//     width: canvasElement.width * poseRectRatio.w,
//     height: canvasElement.height * poseRectRatio.h
// }
const collisionDetectionTypes = ["reaction", "cone", "hurdle"]
class Game {
    constructor(type, model_type = null) {
        this.config;
        this.model;
        this.poseLandmarks = [];
        this.model_type = model_type;
        this.type = type;
        this.isStart = false;
        this.score = 0;
        this.reactionPoint = null;
        this.conePoints = [];
        this.hurdlePoints = [];
        this.startingRect = { left: 0.4, right: 0.6 };
        this.start = () => {
            this.isStart = true;
            this.poseLandmarks = [];
            this.score = 0;
            this.reactionPoint = null;
            this.conePoints = [];
            this.hurdlePoints = [];
            this.isLeft = null;
            this.isMiddle = true;
            if (collisionDetectionTypes.includes(this.type)) {
                this.initPoints();
            } else {
                this.poseCounter = new PoseCounter(this.config)
                this.poseCounter.start()
            }
            // window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "START_GAME" }));

        }
        this.initPoints = () => {
            if (type == "reaction") {
                this.reactionPoint = this.generateReactionPoint(Math.random());
            } else if (type == "cone") {
                this.conePoints[0] = this.generateConePoint(true);
                this.conePoints[1] = this.generateConePoint(false);
            } else if (type == "hurdle") {
                this.hurdlePoints[0] = this.generateHurdlePoint(true);
                this.hurdlePoints[1] = this.generateHurdlePoint(false);
            }
        }
        this.convertPoseLandmarksPosenetToMediaPipe = (pose) => {
            this.poseLandmarks = [];
            for (var i = 0; i <= 32; i++) {
                this.poseLandmarks.push({ visibility: 0, x: -1, y: -1 });
            }
            this.poseLandmarks[0] = { visibility: pose["keypoints"][0].score, x: 1 - pose["keypoints"][0].position.x / canvasElement.width, y: pose["keypoints"][0].position.y / canvasElement.height };
            this.poseLandmarks[2] = { visibility: pose["keypoints"][1].score, x: 1 - pose["keypoints"][1].position.x / canvasElement.width, y: pose["keypoints"][1].position.y / canvasElement.height };
            this.poseLandmarks[5] = { visibility: pose["keypoints"][2].score, x: 1 - pose["keypoints"][2].position.x / canvasElement.width, y: pose["keypoints"][2].position.y / canvasElement.height };

            this.poseLandmarks[11] = { visibility: pose["keypoints"][6].score, x: 1 - pose["keypoints"][6].position.x / canvasElement.width, y: pose["keypoints"][6].position.y / canvasElement.height };
            this.poseLandmarks[12] = { visibility: pose["keypoints"][5].score, x: 1 - pose["keypoints"][5].position.x / canvasElement.width, y: pose["keypoints"][5].position.y / canvasElement.height };
            this.poseLandmarks[13] = { visibility: pose["keypoints"][8].score, x: 1 - pose["keypoints"][8].position.x / canvasElement.width, y: pose["keypoints"][8].position.y / canvasElement.height };
            this.poseLandmarks[14] = { visibility: pose["keypoints"][7].score, x: 1 - pose["keypoints"][7].position.x / canvasElement.width, y: pose["keypoints"][7].position.y / canvasElement.height };
            this.poseLandmarks[15] = { visibility: pose["keypoints"][10].score, x: 1 - pose["keypoints"][10].position.x / canvasElement.width, y: pose["keypoints"][10].position.y / canvasElement.height };
            this.poseLandmarks[16] = { visibility: pose["keypoints"][9].score, x: 1 - pose["keypoints"][9].position.x / canvasElement.width, y: pose["keypoints"][9].position.y / canvasElement.height };

            this.poseLandmarks[23] = { visibility: pose["keypoints"][12].score, x: 1 - pose["keypoints"][12].position.x / canvasElement.width, y: pose["keypoints"][12].position.y / canvasElement.height };
            this.poseLandmarks[24] = { visibility: pose["keypoints"][11].score, x: 1 - pose["keypoints"][11].position.x / canvasElement.width, y: pose["keypoints"][11].position.y / canvasElement.height };
            this.poseLandmarks[25] = { visibility: pose["keypoints"][14].score, x: 1 - pose["keypoints"][14].position.x / canvasElement.width, y: pose["keypoints"][14].position.y / canvasElement.height };
            this.poseLandmarks[26] = { visibility: pose["keypoints"][13].score, x: 1 - pose["keypoints"][13].position.x / canvasElement.width, y: pose["keypoints"][13].position.y / canvasElement.height };
            this.poseLandmarks[27] = { visibility: pose["keypoints"][16].score, x: 1 - pose["keypoints"][16].position.x / canvasElement.width, y: pose["keypoints"][16].position.y / canvasElement.height };
            this.poseLandmarks[28] = { visibility: pose["keypoints"][15].score, x: 1 - pose["keypoints"][15].position.x / canvasElement.width, y: pose["keypoints"][15].position.y / canvasElement.height };
        }
        this.update = (poseLandmarks) => {


            if (!this.isStart) {
                this.drawStartingRect();
                this.checkBodyInStartingRect();
            } else {
                this.drawActionPoints();
                // if (this.checkBodyInScreen()) {
                if (collisionDetectionTypes.includes(type)) {
                    this.collisionDetection();
                }
                else {
                    this.poseCounter.classify();
                    this.score = this.poseCounter.score;
                }
                // }

                scoreText.innerHTML = `score : ${this.score}`;
            }
        }
        this.generateConePoint = (left) => {
            var x, y;
            y = 0.8;
            if (left) {
                x = 0.1;
            } else {
                x = 0.9;
            }
            return new ActionPoint("cone", x, y);
        }
        this.generateHurdlePoint = (left) => {
            var x, y;
            y = 0.8;
            if (left) {
                x = 0.4;
            } else {
                x = 0.6;
            }
            return new ActionPoint("hurdle", x, y);
        }
        this.generateReactionPoint = (preX) => {
            var min, max;
            var x, y;
            min = 0.3;
            max = 0.9;
            y = Math.random() * (max - min) + min;
            if (preX > 0.5) {
                min = 0.05, max = 0.2;
            } else {
                min = 0.8, max = 0.95;
            }
            x = Math.random() * (max - min) + min;
            return new ActionPoint("reaction", x, y);
        }
        this.drawActionPoints = () => {
            if (this.reactionPoint != null) {
                this.reactionPoint.draw();
            } else if (this.conePoints.length > 0) {
                this.conePoints.forEach(element => element.draw());
            } else if (this.hurdlePoints.length > 0) {
                this.hurdlePoints.forEach(element => element.draw());
            }
        }
        this.collisionDetection = () => {
            if (this.reactionPoint) {
                if (this.reactionPoint.isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[17].x, this.poseLandmarks[17].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[18].x, this.poseLandmarks[18].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[19].x, this.poseLandmarks[19].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[20].x, this.poseLandmarks[20].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[21].x, this.poseLandmarks[21].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[22].x, this.poseLandmarks[22].y)) {
                    successSound.play();
                    this.score++;

                    window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    this.reactionPoint = this.generateReactionPoint(this.reactionPoint.x);
                }
            } else if (this.conePoints.length > 0) {
                if (this.conePoints[1].isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[17].x, this.poseLandmarks[17].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[18].x, this.poseLandmarks[18].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[19].x, this.poseLandmarks[19].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[20].x, this.poseLandmarks[20].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[21].x, this.poseLandmarks[21].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[22].x, this.poseLandmarks[22].y)) {
                    if (this.conePoints[1].isHit == null) {
                        this.conePoints[1].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    } else if (this.conePoints[0].isHit != null && this.conePoints[0].isHit) {
                        this.conePoints[0].isHit = false;
                        this.conePoints[1].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    }
                }
                else if (this.conePoints[0].isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[17].x, this.poseLandmarks[17].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[18].x, this.poseLandmarks[18].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[19].x, this.poseLandmarks[19].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[20].x, this.poseLandmarks[20].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[21].x, this.poseLandmarks[21].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[22].x, this.poseLandmarks[22].y)) {
                    if (this.conePoints[0].isHit == null) {
                        this.conePoints[0].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    } else if (this.conePoints[1].isHit != null && this.conePoints[1].isHit) {
                        this.conePoints[1].isHit = false;
                        this.conePoints[0].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    }
                }
            } else if (this.hurdlePoints.length > 0) {
                for (var i = 0; i < this.poseLandmarks.length; i++) {
                    if (this.hurdlePoints[0].isCollide(this.poseLandmarks[i].x, this.poseLandmarks[i].y) ||
                        this.hurdlePoints[1].isCollide(this.poseLandmarks[i].x, this.poseLandmarks[i].y)) {
                        this.isMiddle = null;
                        statusText.innerHTML = 'required mid';
                        break;
                    }
                }
                const right_foot_index = this.poseLandmarks[28];
                const left_foot_index = this.poseLandmarks[27];
                if (this.isMiddle != null) {
                    if (left_foot_index.y > 0.75 && right_foot_index.y < 0.75) {
                        if (left_foot_index.x < 0.3 && right_foot_index.x < 0.3) {
                            statusText.innerHTML = 'left'
                            if (this.isMiddle && (this.isLeft == null || this.isLeft == false)) {
                                successSound.play();
                                this.score++;
                                window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                                this.isLeft = true;
                            }
                        }
                        else if (left_foot_index.x > 0.6 && right_foot_index.x > 0.6) {
                            statusText.innerHTML = 'right'
                            if (this.isMiddle && (this.isLeft == null || this.isLeft == true)) {
                                successSound.play();
                                this.score++;
                                window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                                this.isLeft = false;
                            }
                        } else {
                            statusText.innerHTML = '- - -'
                            this.isMiddle = null;
                        }
                    }
                } else {
                    if (left_foot_index.x >= 0.3 && left_foot_index.x < 0.6
                        && right_foot_index.x >= 0.3 && right_foot_index.x < 0.6) {
                        statusText.innerHTML = 'middle'
                        this.isMiddle = true;
                    }
                }

            }
        }
        this.checkBodyInScreen = () => {
            var requiredPoints;
            if (game.model_type != "posenet") {
                requiredPoints = [0, 11, 12, 32, 31];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    return true;
                }
            } else {
                requiredPoints = [0, 11, 12, 28, 27];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    return true;
                }
            }
            return false;
        }
        this.checkBodyInStartingRect = () => {
            var requiredPoints;
            if (game.model_type != "posenet") {

                this.start();
                return true;
                requiredPoints = [0, 11, 12, 32, 31];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    var maxY = Math.max(this.poseLandmarks[32].y, this.poseLandmarks[31].y);
                    const nose = this.poseLandmarks[0];
                    const left_shoulder = this.poseLandmarks[11];
                    const right_shoulder = this.poseLandmarks[12];
                    if (maxY > 0.85 && maxY < 1 && nose.y > 0 && nose.y < 0.4 && left_shoulder.y > 0 && left_shoulder.y < 0.5 && right_shoulder.y > 0 && right_shoulder.y < 0.5) {
                        if (nose.x > this.startingRect.left && nose.x < this.startingRect.right && left_shoulder.x > this.startingRect.left && right_shoulder.x < this.startingRect.right) {
                            this.start();
                            return true
                        }
                    }
                }
            } else {

                requiredPoints = [0, 11, 12, 28, 27];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    var maxY = Math.max(this.poseLandmarks[28].y, this.poseLandmarks[27].y);
                    const nose = this.poseLandmarks[0];
                    const left_shoulder = this.poseLandmarks[11];
                    const right_shoulder = this.poseLandmarks[12];
                    if (maxY > 0.75 && maxY < 1 && nose.y > 0 && nose.y < 0.4 && left_shoulder.y > 0 && left_shoulder.y < 0.5 && right_shoulder.y > 0 && right_shoulder.y < 0.5) {
                        if (nose.x > this.startingRect.left && nose.x < this.startingRect.right && left_shoulder.x > this.startingRect.left && right_shoulder.x < this.startingRect.right) {
                            this.start();
                            return true
                        }
                    }
                }
            }
            return false;
        }
        this.checkRequiredPoints = (points) => {
            for (var i = 0; i <= points.length; i++) {
                if (this.poseLandmarks[points[i]] != null && this.poseLandmarks[points[i]].visibility <= 0.7
                ) {
                    return false;
                }
            }
            return true;
        }
        this.drawStartingRect = () => {

            canvasCtx.beginPath();
            canvasCtx.lineWidth = "6";
            canvasCtx.strokeStyle = "red";
            canvasCtx.rect(
                this.startingRect.left * canvasElement.width, 0, (this.startingRect.right - this.startingRect.left) * canvasElement.width, canvasElement.height);
            canvasCtx.stroke();
            // canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        }

    }
}
class ActionPoint {
    constructor(type, x, y) {
        this.type = type;
        this.x = x || 0;
        this.y = y || 0;
        this.radius = 30;
        this.xInCanvs = this.x * canvasElement.width;
        this.yInCanvs = this.y * canvasElement.height;
        this.isHit = null;
        if (type == "cone") {
            var img = new Image();
            img.src = 'cone.png';
            this.image = img;
        } else if (type == "hurdle") {
            var img = new Image();
            img.src = 'cone.png';
            this.image = img;
        }
    }
    isCollide(x, y) {
        var hit_range = game.model_type == "posenet" ? 0.1 : 0.05;
        canvasCtx.beginPath();
        canvasCtx.lineWidth = "6";
        canvasCtx.strokeStyle = "red";
        canvasCtx.rect(
            (x - hit_range / 2) * canvasElement.width, (y - hit_range / 2) * canvasElement.height, hit_range * canvasElement.width, hit_range * canvasElement.height);
        canvasCtx.stroke();
        return !(
            ((y + hit_range) < (this.y)) ||
            (y > (this.y + hit_range)) ||
            ((x + hit_range) < this.x) ||
            (x > (this.x + hit_range))
        );
    }
    draw() {
        if (this.type == "reaction") {
            canvasCtx.beginPath();
            canvasCtx.arc(this.xInCanvs, this.yInCanvs, this.radius, 0, 2 * Math.PI);
            canvasCtx.fillStyle = this.isHit ? 'green' : 'red';
            canvasCtx.fill();
            canvasCtx.lineWidth = 5;
            canvasCtx.strokeStyle = '#003300';
            canvasCtx.stroke();
        } else if (this.type == "cone") {
            const ratio = this.image.width / canvasElement.height;
            const image_height = 150;
            const new_image_width = image_height * ratio;
            canvasCtx.drawImage(this.image, this.xInCanvs - new_image_width / ratio / 2, this.yInCanvs, new_image_width, image_height);
        } else if (this.type == "hurdle") {
            const ratio = this.image.width / canvasElement.height;
            const image_height = 150;
            const new_image_width = image_height * ratio;
            canvasCtx.drawImage(this.image, this.xInCanvs - new_image_width / ratio / 2, this.yInCanvs, new_image_width, image_height);
        }
    }

}
function onResults(results) {
    if (results.poseLandmarks) {
        game.poseLandmarks = results.poseLandmarks;
        // console.log('results.poseLandmarks: ', results.poseLandmarks);
    }
    else {
        if (game.poseCounter && game.isStart) {
            game.poseCounter.exceptionCount++
            if (game.poseCounter.exceptionCount > 100) {
                statusText.innerHTML = "no pose data, please start from first action"
                game.poseCounter.resetAll();
            }
            //poseCounter.resetAll()
            errorText.innerHTML = game.poseCounter.exceptionCount
        }
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: 2 });

    canvasCtx.restore();

    game.update(results.poseLandmarks);
}

var game = new Game(poseName, model_type);
//["reaction", "cone", "hurdle"]
$.getJSON('poseConfig.json', function (data) {
    game.config = data[poseName];
    if (game.model_type != "posenet") {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
            }
        });
        pose.setOptions({
            modelComplexity: 1,
            selfieMode: false,
            upperBodyOnly: false,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);

        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia;

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                try {
                    await pose.send({ image: videoElement });
                }
                catch (error) {
                    statusText.innerHTML = error

                }
            },
            facingMode : 'environment',
            width: videoWidth,
            height: videoHeight
        });
        camera.start();
    } else {
        posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            // inputResolution: 500,
            // multiplier:0.5,
            // quantBytes: 2,
        }).then(function (loadedModel) {
            game.model = loadedModel;
            navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: "user" }, audio: false })
                .then(function (stream) {
                    videoElement.srcObject = stream;
                    videoElement.addEventListener('loadeddata', predictWebcam);
                }).catch(function (error) {
                    statusText.innerHTML = console.error;;
                    console.log(error);
                });
        });
    }
});
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
async function predictWebcam() {
    let pose = await game.model.estimateSinglePose(videoElement, {
        flipHorizontal: false
    })
    if (pose) {
        game.convertPoseLandmarksPosenetToMediaPipe(pose);
    }
    canvasCtx.save();
    //filp video
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    //
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    const minPartConfidence = 0.5;
    drawKeypoints(pose["keypoints"], minPartConfidence, canvasCtx);
    // drawSkeleton(pose["keypoints"], minPartConfidence, canvasCtx);

    canvasCtx.restore();
    game.update();

    window.requestAnimationFrame(predictWebcam);
}const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const canvasCtx = canvasElement.getContext('2d');
//text component
const statusText = document.getElementById("status");
const scoreText = document.getElementById("score");
const successSound = new Audio("popsound.mp3")

const videoWidth = window.innerWidth;
const videoHeight = window.innerHeight;
canvasElement.width = videoWidth
canvasElement.height = videoHeight
videoElement.width = videoWidth;
videoElement.height = videoHeight;
// canvasElement.width = videoWidth
// canvasElement.height = videoHeight
// const poseRectRatio = {
//     w: .5,
//     h: .9
// }
// const poseRect = {
//     left: canvasElement.width * (1 - poseRectRatio.w) / 2,
//     top: canvasElement.height * (1 - poseRectRatio.h) / 2,
//     bottom: canvasElement.height * (poseRectRatio.h + (1 - poseRectRatio.h) / 2),
//     right: canvasElement.width * (poseRectRatio.w + (1 - poseRectRatio.w) / 2),
//     width: canvasElement.width * poseRectRatio.w,
//     height: canvasElement.height * poseRectRatio.h
// }
const collisionDetectionTypes = ["reaction", "cone", "hurdle"]
class Game {
    constructor(type, model_type = null) {
        this.config;
        this.model;
        this.poseLandmarks = [];
        this.model_type = model_type;
        this.type = type;
        this.isStart = false;
        this.score = 0;
        this.reactionPoint = null;
        this.conePoints = [];
        this.hurdlePoints = [];
        this.startingRect = { left: 0.4, right: 0.6 };
        this.start = () => {
            this.isStart = true;
            this.poseLandmarks = [];
            this.score = 0;
            this.reactionPoint = null;
            this.conePoints = [];
            this.hurdlePoints = [];
            this.isLeft = null;
            this.isMiddle = true;
            if (collisionDetectionTypes.includes(this.type)) {
                this.initPoints();
            } else {
                this.poseCounter = new PoseCounter(this.config)
                this.poseCounter.start()
            }
            // window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "START_GAME" }));

        }
        this.initPoints = () => {
            if (type == "reaction") {
                this.reactionPoint = this.generateReactionPoint(Math.random());
            } else if (type == "cone") {
                this.conePoints[0] = this.generateConePoint(true);
                this.conePoints[1] = this.generateConePoint(false);
            } else if (type == "hurdle") {
                this.hurdlePoints[0] = this.generateHurdlePoint(true);
                this.hurdlePoints[1] = this.generateHurdlePoint(false);
            }
        }
        this.convertPoseLandmarksPosenetToMediaPipe = (pose) => {
            this.poseLandmarks = [];
            for (var i = 0; i <= 32; i++) {
                this.poseLandmarks.push({ visibility: 0, x: -1, y: -1 });
            }
            this.poseLandmarks[0] = { visibility: pose["keypoints"][0].score, x: 1 - pose["keypoints"][0].position.x / canvasElement.width, y: pose["keypoints"][0].position.y / canvasElement.height };
            this.poseLandmarks[2] = { visibility: pose["keypoints"][1].score, x: 1 - pose["keypoints"][1].position.x / canvasElement.width, y: pose["keypoints"][1].position.y / canvasElement.height };
            this.poseLandmarks[5] = { visibility: pose["keypoints"][2].score, x: 1 - pose["keypoints"][2].position.x / canvasElement.width, y: pose["keypoints"][2].position.y / canvasElement.height };

            this.poseLandmarks[11] = { visibility: pose["keypoints"][6].score, x: 1 - pose["keypoints"][6].position.x / canvasElement.width, y: pose["keypoints"][6].position.y / canvasElement.height };
            this.poseLandmarks[12] = { visibility: pose["keypoints"][5].score, x: 1 - pose["keypoints"][5].position.x / canvasElement.width, y: pose["keypoints"][5].position.y / canvasElement.height };
            this.poseLandmarks[13] = { visibility: pose["keypoints"][8].score, x: 1 - pose["keypoints"][8].position.x / canvasElement.width, y: pose["keypoints"][8].position.y / canvasElement.height };
            this.poseLandmarks[14] = { visibility: pose["keypoints"][7].score, x: 1 - pose["keypoints"][7].position.x / canvasElement.width, y: pose["keypoints"][7].position.y / canvasElement.height };
            this.poseLandmarks[15] = { visibility: pose["keypoints"][10].score, x: 1 - pose["keypoints"][10].position.x / canvasElement.width, y: pose["keypoints"][10].position.y / canvasElement.height };
            this.poseLandmarks[16] = { visibility: pose["keypoints"][9].score, x: 1 - pose["keypoints"][9].position.x / canvasElement.width, y: pose["keypoints"][9].position.y / canvasElement.height };

            this.poseLandmarks[23] = { visibility: pose["keypoints"][12].score, x: 1 - pose["keypoints"][12].position.x / canvasElement.width, y: pose["keypoints"][12].position.y / canvasElement.height };
            this.poseLandmarks[24] = { visibility: pose["keypoints"][11].score, x: 1 - pose["keypoints"][11].position.x / canvasElement.width, y: pose["keypoints"][11].position.y / canvasElement.height };
            this.poseLandmarks[25] = { visibility: pose["keypoints"][14].score, x: 1 - pose["keypoints"][14].position.x / canvasElement.width, y: pose["keypoints"][14].position.y / canvasElement.height };
            this.poseLandmarks[26] = { visibility: pose["keypoints"][13].score, x: 1 - pose["keypoints"][13].position.x / canvasElement.width, y: pose["keypoints"][13].position.y / canvasElement.height };
            this.poseLandmarks[27] = { visibility: pose["keypoints"][16].score, x: 1 - pose["keypoints"][16].position.x / canvasElement.width, y: pose["keypoints"][16].position.y / canvasElement.height };
            this.poseLandmarks[28] = { visibility: pose["keypoints"][15].score, x: 1 - pose["keypoints"][15].position.x / canvasElement.width, y: pose["keypoints"][15].position.y / canvasElement.height };
        }
        this.update = (poseLandmarks) => {


            if (!this.isStart) {
                this.drawStartingRect();
                this.checkBodyInStartingRect();
            } else {
                this.drawActionPoints();
                // if (this.checkBodyInScreen()) {
                if (collisionDetectionTypes.includes(type)) {
                    this.collisionDetection();
                }
                else {
                    this.poseCounter.classify();
                    this.score = this.poseCounter.score;
                }
                // }

                scoreText.innerHTML = `score : ${this.score}`;
            }
        }
        this.generateConePoint = (left) => {
            var x, y;
            y = 0.8;
            if (left) {
                x = 0.1;
            } else {
                x = 0.9;
            }
            return new ActionPoint("cone", x, y);
        }
        this.generateHurdlePoint = (left) => {
            var x, y;
            y = 0.8;
            if (left) {
                x = 0.4;
            } else {
                x = 0.6;
            }
            return new ActionPoint("hurdle", x, y);
        }
        this.generateReactionPoint = (preX) => {
            var min, max;
            var x, y;
            min = 0.3;
            max = 0.9;
            y = Math.random() * (max - min) + min;
            if (preX > 0.5) {
                min = 0.05, max = 0.2;
            } else {
                min = 0.8, max = 0.95;
            }
            x = Math.random() * (max - min) + min;
            return new ActionPoint("reaction", x, y);
        }
        this.drawActionPoints = () => {
            if (this.reactionPoint != null) {
                this.reactionPoint.draw();
            } else if (this.conePoints.length > 0) {
                this.conePoints.forEach(element => element.draw());
            } else if (this.hurdlePoints.length > 0) {
                this.hurdlePoints.forEach(element => element.draw());
            }
        }
        this.collisionDetection = () => {
            if (this.reactionPoint) {
                if (this.reactionPoint.isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[17].x, this.poseLandmarks[17].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[18].x, this.poseLandmarks[18].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[19].x, this.poseLandmarks[19].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[20].x, this.poseLandmarks[20].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[21].x, this.poseLandmarks[21].y) ||
                    this.reactionPoint.isCollide(this.poseLandmarks[22].x, this.poseLandmarks[22].y)) {
                    successSound.play();
                    this.score++;

                    window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    this.reactionPoint = this.generateReactionPoint(this.reactionPoint.x);
                }
            } else if (this.conePoints.length > 0) {
                if (this.conePoints[1].isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[17].x, this.poseLandmarks[17].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[18].x, this.poseLandmarks[18].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[19].x, this.poseLandmarks[19].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[20].x, this.poseLandmarks[20].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[21].x, this.poseLandmarks[21].y) ||
                    this.conePoints[1].isCollide(this.poseLandmarks[22].x, this.poseLandmarks[22].y)) {
                    if (this.conePoints[1].isHit == null) {
                        this.conePoints[1].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    } else if (this.conePoints[0].isHit != null && this.conePoints[0].isHit) {
                        this.conePoints[0].isHit = false;
                        this.conePoints[1].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    }
                }
                else if (this.conePoints[0].isCollide(this.poseLandmarks[15].x, this.poseLandmarks[15].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[16].x, this.poseLandmarks[16].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[17].x, this.poseLandmarks[17].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[18].x, this.poseLandmarks[18].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[19].x, this.poseLandmarks[19].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[20].x, this.poseLandmarks[20].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[21].x, this.poseLandmarks[21].y) ||
                    this.conePoints[0].isCollide(this.poseLandmarks[22].x, this.poseLandmarks[22].y)) {
                    if (this.conePoints[0].isHit == null) {
                        this.conePoints[0].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    } else if (this.conePoints[1].isHit != null && this.conePoints[1].isHit) {
                        this.conePoints[1].isHit = false;
                        this.conePoints[0].isHit = true;
                        successSound.play();
                        this.score++;
                        window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                    }
                }
            } else if (this.hurdlePoints.length > 0) {
                for (var i = 0; i < this.poseLandmarks.length; i++) {
                    if (this.hurdlePoints[0].isCollide(this.poseLandmarks[i].x, this.poseLandmarks[i].y) ||
                        this.hurdlePoints[1].isCollide(this.poseLandmarks[i].x, this.poseLandmarks[i].y)) {
                        this.isMiddle = null;
                        statusText.innerHTML = 'required mid';
                        break;
                    }
                }
                const right_foot_index = this.poseLandmarks[28];
                const left_foot_index = this.poseLandmarks[27];
                if (this.isMiddle != null) {
                    if (left_foot_index.y > 0.75 && right_foot_index.y < 0.75) {
                        if (left_foot_index.x < 0.3 && right_foot_index.x < 0.3) {
                            statusText.innerHTML = 'left'
                            if (this.isMiddle && (this.isLeft == null || this.isLeft == false)) {
                                successSound.play();
                                this.score++;
                                window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                                this.isLeft = true;
                            }
                        }
                        else if (left_foot_index.x > 0.6 && right_foot_index.x > 0.6) {
                            statusText.innerHTML = 'right'
                            if (this.isMiddle && (this.isLeft == null || this.isLeft == true)) {
                                successSound.play();
                                this.score++;
                                window.ReactNativeWebView?.postMessage(JSON.stringify({ action: "SCORE_UPDATE", data: this.score }));

                                this.isLeft = false;
                            }
                        } else {
                            statusText.innerHTML = '- - -'
                            this.isMiddle = null;
                        }
                    }
                } else {
                    if (left_foot_index.x >= 0.3 && left_foot_index.x < 0.6
                        && right_foot_index.x >= 0.3 && right_foot_index.x < 0.6) {
                        statusText.innerHTML = 'middle'
                        this.isMiddle = true;
                    }
                }

            }
        }
        this.checkBodyInScreen = () => {
            var requiredPoints;
            if (game.model_type != "posenet") {
                requiredPoints = [0, 11, 12, 32, 31];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    return true;
                }
            } else {
                requiredPoints = [0, 11, 12, 28, 27];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    return true;
                }
            }
            return false;
        }
        this.checkBodyInStartingRect = () => {
            var requiredPoints;
            if (game.model_type != "posenet") {

                this.start();
                return true;
                requiredPoints = [0, 11, 12, 32, 31];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    var maxY = Math.max(this.poseLandmarks[32].y, this.poseLandmarks[31].y);
                    const nose = this.poseLandmarks[0];
                    const left_shoulder = this.poseLandmarks[11];
                    const right_shoulder = this.poseLandmarks[12];
                    if (maxY > 0.85 && maxY < 1 && nose.y > 0 && nose.y < 0.4 && left_shoulder.y > 0 && left_shoulder.y < 0.5 && right_shoulder.y > 0 && right_shoulder.y < 0.5) {
                        if (nose.x > this.startingRect.left && nose.x < this.startingRect.right && left_shoulder.x > this.startingRect.left && right_shoulder.x < this.startingRect.right) {
                            this.start();
                            return true
                        }
                    }
                }
            } else {

                requiredPoints = [0, 11, 12, 28, 27];
                if (this.poseLandmarks.length > 0 && this.checkRequiredPoints(requiredPoints)) {
                    var maxY = Math.max(this.poseLandmarks[28].y, this.poseLandmarks[27].y);
                    const nose = this.poseLandmarks[0];
                    const left_shoulder = this.poseLandmarks[11];
                    const right_shoulder = this.poseLandmarks[12];
                    if (maxY > 0.75 && maxY < 1 && nose.y > 0 && nose.y < 0.4 && left_shoulder.y > 0 && left_shoulder.y < 0.5 && right_shoulder.y > 0 && right_shoulder.y < 0.5) {
                        if (nose.x > this.startingRect.left && nose.x < this.startingRect.right && left_shoulder.x > this.startingRect.left && right_shoulder.x < this.startingRect.right) {
                            this.start();
                            return true
                        }
                    }
                }
            }
            return false;
        }
        this.checkRequiredPoints = (points) => {
            for (var i = 0; i <= points.length; i++) {
                if (this.poseLandmarks[points[i]] != null && this.poseLandmarks[points[i]].visibility <= 0.7
                ) {
                    return false;
                }
            }
            return true;
        }
        this.drawStartingRect = () => {

            canvasCtx.beginPath();
            canvasCtx.lineWidth = "6";
            canvasCtx.strokeStyle = "red";
            canvasCtx.rect(
                this.startingRect.left * canvasElement.width, 0, (this.startingRect.right - this.startingRect.left) * canvasElement.width, canvasElement.height);
            canvasCtx.stroke();
            // canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

        }

    }
}
class ActionPoint {
    constructor(type, x, y) {
        this.type = type;
        this.x = x || 0;
        this.y = y || 0;
        this.radius = 30;
        this.xInCanvs = this.x * canvasElement.width;
        this.yInCanvs = this.y * canvasElement.height;
        this.isHit = null;
        if (type == "cone") {
            var img = new Image();
            img.src = 'cone.png';
            this.image = img;
        } else if (type == "hurdle") {
            var img = new Image();
            img.src = 'cone.png';
            this.image = img;
        }
    }
    isCollide(x, y) {
        var hit_range = game.model_type == "posenet" ? 0.1 : 0.05;
        canvasCtx.beginPath();
        canvasCtx.lineWidth = "6";
        canvasCtx.strokeStyle = "red";
        canvasCtx.rect(
            (x - hit_range / 2) * canvasElement.width, (y - hit_range / 2) * canvasElement.height, hit_range * canvasElement.width, hit_range * canvasElement.height);
        canvasCtx.stroke();
        return !(
            ((y + hit_range) < (this.y)) ||
            (y > (this.y + hit_range)) ||
            ((x + hit_range) < this.x) ||
            (x > (this.x + hit_range))
        );
    }
    draw() {
        if (this.type == "reaction") {
            canvasCtx.beginPath();
            canvasCtx.arc(this.xInCanvs, this.yInCanvs, this.radius, 0, 2 * Math.PI);
            canvasCtx.fillStyle = this.isHit ? 'green' : 'red';
            canvasCtx.fill();
            canvasCtx.lineWidth = 5;
            canvasCtx.strokeStyle = '#003300';
            canvasCtx.stroke();
        } else if (this.type == "cone") {
            const ratio = this.image.width / canvasElement.height;
            const image_height = 150;
            const new_image_width = image_height * ratio;
            canvasCtx.drawImage(this.image, this.xInCanvs - new_image_width / ratio / 2, this.yInCanvs, new_image_width, image_height);
        } else if (this.type == "hurdle") {
            const ratio = this.image.width / canvasElement.height;
            const image_height = 150;
            const new_image_width = image_height * ratio;
            canvasCtx.drawImage(this.image, this.xInCanvs - new_image_width / ratio / 2, this.yInCanvs, new_image_width, image_height);
        }
    }

}
function onResults(results) {
    if (results.poseLandmarks) {
        game.poseLandmarks = results.poseLandmarks;
        // console.log('results.poseLandmarks: ', results.poseLandmarks);

    }
    else {
        if (game.poseCounter && game.isStart) {
            game.poseCounter.exceptionCount++
            if (game.poseCounter.exceptionCount > 100) {
                statusText.innerHTML = "no pose data, please start from first action"
                game.poseCounter.resetAll();
            }
            //poseCounter.resetAll()
            errorText.innerHTML = game.poseCounter.exceptionCount
        }
    }
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);

    canvasCtx.drawImage(
        results.image, 0, 0, canvasElement.width, canvasElement.height);

    drawConnectors(canvasCtx, results.poseLandmarks, POSE_CONNECTIONS,
        { color: '#00FF00', lineWidth: 4 });
    drawLandmarks(canvasCtx, results.poseLandmarks,
        { color: '#FF0000', lineWidth: 2 });

    canvasCtx.restore();

    game.update(results.poseLandmarks);
}

var game = new Game(poseName, model_type);
//["reaction", "cone", "hurdle"]
// if (collisionDetectionTypes.includes(poseName)) {
//     if (game.model_type != "posenet") {
//         const pose = new Pose({
//             locateFile: (file) => {
//                 return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
//             }
//         });
//         pose.setOptions({
//             modelComplexity: 1,
//             selfieMode: true,
//             upperBodyOnly: false,
//             smoothLandmarks: true,
//             minDetectionConfidence: 0.5,
//             minTrackingConfidence: 0.5
//         });

//         pose.onResults(onResults);

//         navigator.getUserMedia = navigator.getUserMedia ||
//             navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia;

//         const camera = new Camera(videoElement, {
//             onFrame: async () => {
//                 await pose.send({ image: videoElement });
//             },
//             width: videoWidth,
//             height: videoHeight
//         });
//         camera.start();
//     } else {
//         posenet.load({
//             architecture: 'MobileNetV1',
//             outputStride: 16,
//             // inputResolution: 500,
//             // multiplier:0.5,
//             // quantBytes: 2,
//         }).then(function (loadedModel) {
//             game.model = loadedModel;
//             navigator.getUserMedia = navigator.getUserMedia ||
//                 navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia
//             navigator.mediaDevices
//                 .getUserMedia({ video: { facingMode: "user" }, audio: false })
//                 .then(function (stream) {
//                     videoElement.srcObject = stream;
//                     videoElement.addEventListener('loadeddata', predictWebcam);
//                 }).catch(function (error) {
//                     statusText.innerHTML = console.error;;
//                     console.log(error);
//                 });
//         });
//     }
// } else {

$.getJSON('poseConfig.json', function (data) {
    game.config = data[poseName];
    if (game.model_type != "posenet") {
        const pose = new Pose({
            locateFile: (file) => {
                return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
            }
        });
        pose.setOptions({
            modelComplexity: 1,
            selfieMode: false,
            upperBodyOnly: false,
            smoothLandmarks: true,
            minDetectionConfidence: 0.5,
            minTrackingConfidence: 0.5
        });

        pose.onResults(onResults);

        navigator.getUserMedia = navigator.getUserMedia ||
            navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia;

        const camera = new Camera(videoElement, {
            onFrame: async () => {
                try {
                    await pose.send({ image: videoElement });
                }
                catch (error) {
                    statusText.innerHTML = error

                }
            },
            facingMode : 'environment',
            width: videoWidth,
            height: videoHeight
        });
        camera.start();
    } else {
        posenet.load({
            architecture: 'MobileNetV1',
            outputStride: 16,
            // inputResolution: 500,
            // multiplier:0.5,
            // quantBytes: 2,
        }).then(function (loadedModel) {
            game.model = loadedModel;
            navigator.getUserMedia = navigator.getUserMedia ||
                navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.mediaDevices.getUserMedia
            navigator.mediaDevices
                .getUserMedia({ video: { facingMode: "user" }, audio: false })
                .then(function (stream) {
                    videoElement.srcObject = stream;
                    videoElement.addEventListener('loadeddata', predictWebcam);
                }).catch(function (error) {
                    statusText.innerHTML = console.error;;
                    console.log(error);
                });
        });
    }
});

// }
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
async function predictWebcam() {
    let pose = await game.model.estimateSinglePose(videoElement, {
        flipHorizontal: false
    })
    if (pose) {
        game.convertPoseLandmarksPosenetToMediaPipe(pose);
    }
    canvasCtx.save();
    //filp video
    canvasCtx.scale(-1, 1);
    canvasCtx.translate(-canvasElement.width, 0);
    //
    canvasCtx.drawImage(videoElement, 0, 0, canvasElement.width, canvasElement.height);
    const minPartConfidence = 0.5;
    drawKeypoints(pose["keypoints"], minPartConfidence, canvasCtx);
    // drawSkeleton(pose["keypoints"], minPartConfidence, canvasCtx);

    canvasCtx.restore();
    game.update();

    window.requestAnimationFrame(predictWebcam);
}