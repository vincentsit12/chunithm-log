(function () {
    const difficultyList = ['ultima', 'master', 'expert']
    let scoreList = []
    // const hostUrl = 'https://chuni-log.com'
    const hostUrl = 'http://localhost:3000'
    async function getScoreList(difficulty, songs) {
        const url = 'https://chunithm-net-eng.com/mobile/record/musicGenre/' + difficulty
        return fetch(url, { credentials: 'include' })
            .then(function (response) {
                return response.text()
            }).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                const musiclist = $(doc).find('.musiclist_box')
                if (musiclist.length <= 0) {
                    throw ('fail, please try again on this link ' + url);

                }
                else {


                    for (let i = 0; i < musiclist.length; i++) {
                        let highscore = musiclist[i].getElementsByClassName('play_musicdata_highscore')[0]
                        if (highscore) {
                            let songName = musiclist[i].getElementsByClassName('music_title')[0].innerText
                            let score = $(highscore).find('span')[0].innerText.split(',').join('')
                            // let rate = calculateSingleSongRating(songName, score);

                            if (parseInt(score) >= 0) {
                                // if (songs[reEscape(songName)][difficulty]) {
                                scoreList.push({
                                    name: songName,
                                    // user_id: userID,
                                    // song_id: songs[reEscape(songName)].id,
                                    // rate: songs[reEscape(songName)][difficulty],
                                    difficulty: difficulty,
                                    score: parseInt(score),
                                })
                                // }
                            }

                        }
                    }

                }



            }).catch(e => {
                console.log('calculateRating', e)
                alert('fail, please try again on the musicGenre/' + difficulty + ' page')
            });
    }


    async function init() {

        // fetch("https://chuni-log.com/api/songs", {
        //     method: "GET",
        //     headers: { "Content-Type": "application/json" },
        // }).then(r => r.json()).then(async r => {
        //     const songs = r
        for (let i = 0; i < difficultyList.length; i++) {
            await getScoreList(difficultyList[i])
        }
        if (scoreList.length <= 0) throw "no songs record, please retry"
        console.table(scoreList)
        fetch(hostUrl + "/api/record/" + userID, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: scoreList, }),
        })
            .then((r) => r.text()).then(r => {
                window.open(hostUrl)
            }).catch(e => alert(e))

        // }).catch(e => {
        //     alert(e)
        // })

    }
    if (userID) {
        init()
    }
    else {
        alert("Invalid!")
    }
})();
