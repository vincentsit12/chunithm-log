(async function () {
    const difficultyList = ['ultima', 'master', 'expert']
    let scoreList = []
    let isLoading = false
    let isAlertShown = false
    const hostUrl = 'https://chuni-log.com'
    // const hostUrl = 'http://localhost:3000'
    function showLoadingView() {
        isLoading = true
        let x = $(".sleep_penguin img").clone().appendTo("body")
        x.css({ "position": "absolute", "top": "200px", "z-index": "200" })
        randomMove(x)
    }
    function randomMove(x) {
        x.animate({
            left: (Math.random() * (window.innerWidth - 60)) + "px",
            top: Math.random() * (window.innerHeight - 88) + "px",
        }, 1000, function () {
            // Animation complete.
            if (isLoading)
                randomMove(x)
            else {
                x.remove()
            }
        });
    }
    function getCookie(cname) {
        let name = cname + "=";
        let decodedCookie = decodeURIComponent(document.cookie);
        let ca = decodedCookie.split(';');
        for(let i = 0; i <ca.length; i++) {
          let c = ca[i];
          while (c.charAt(0) == ' ') {
            c = c.substring(1);
          }
          if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
          }
        }
        return "";
      }
    // function loadHTML() {
    //     var xmlhttp = new XMLHttpRequest();

    //     xmlhttp.withCredentials = true;
    //     xmlhttp.open("GET", 'https://chunithm-net-eng.com/mobile/record/musicGenre/master', true);
    //     xmlhttp.onreadystatechange = function () {
    //         if (xmlhttp.readyState == 4 /* complete */) {
    //                     handler(xmlhttp.responseText);
    //               }
    //     };
    //     xmlhttp.send();
    //     }


    //     function handler(responseText) {
    //     var doc = new DOMParser().parseFromString(responseText, 'text/html');
    //     console.log(doc)
    //     }
    //     loadHTML()
    async function getScoreList(difficulty, songs) {

        let params = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        let formData = new FormData();
        formData.append('genre', 99);
        formData.append('token', getCookie('_t'));
        const url = 'https://chunithm-net-eng.com/mobile/record/musicGenre/send' + params
        return fetch(url, { method: 'POST', body: formData, credentials: 'include' })
            .then(function (response) {
                return response.text()
            }).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                const musiclist = $(doc).find('.musiclist_box')
                if (musiclist.length <= 0) {
                    throw ('fail, please login and try again');
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
                isLoading = false
                if (!isAlertShown) {
                    isAlertShown = true
                    alert(e)
                }

            });
    }


    async function init() {
        try {
            for (let i = 0; i < difficultyList.length; i++) {
                await getScoreList(difficultyList[i])
            }
        } catch (e) {
            isLoading = false
            console.log('calculateRating', e)
            alw
        }

        if (scoreList.length <= 0) throw "no songs record, please retry"
        console.table(scoreList)
        fetch(hostUrl + "/api/record/" + userID, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: scoreList, }),
        })
            .then((r) => r.text()).then(r => {
                window.location = hostUrl
            }).catch(e => {
                alert(e)
            }).finally(() => {
                isLoading = false
            })
    }
    if (userID) {
        showLoadingView()
        await init()
    }
    else {
        alert("Invalid!")
    }
})();
