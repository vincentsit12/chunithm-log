(function () {
    const userID = 1
    const difficultyList = ['ultima', 'master', 'expert']
    let scoreList = []

    Number.prototype.round = function (places) {
        return +(Math.round(this + "e+" + places) + "e-" + places);
    }

    function reEscape(chars) {
        var ascii = '';
        for (var i = 0, l = chars.length; i < l; i++) {
            var c = chars[i].charCodeAt(0);
            if (c >= 0xFF00 && c <= 0xFFEF) {
                c = 0xFF & (c + 0x20);
            }
            ascii += String.fromCharCode(c);
        }

        return ascii.replace(/[\n\s'’]/g, '').replace(/[”“]/g, '\"')
    }
    async function getScoreList(difficulty, songs) {
        const url = `https://chunithm-net-eng.com/mobile/record/musicGenre/${difficulty}`
        return fetch(url, { credentials: 'include' })
            .then(function (response) {
                return response.text()
            }).then(function (html) {
                var doc = new DOMParser().parseFromString(html, 'text/html');
                const musiclist = $(doc).find('.musiclist_box')
                if (musiclist.length <= 0) {
                    throw (`fail, please try again on this link ${url}`);

                }
                else {


                    for (let i = 0; i < musiclist.length; i++) {
                        let highscore = musiclist[i].getElementsByClassName('play_musicdata_highscore')[0]
                        if (highscore) {
                            let songName = musiclist[i].getElementsByClassName('music_title')[0].innerText
                            let score = $(highscore).find('span')[0].innerText.split(',').join('')
                            // let rate = calculateSingleSongRating(songName, score);

                            if (parseInt(score) >= 0 && songs[reEscape(songName)]) {
                                if (songs[reEscape(songName)][difficulty]) {
                                    scoreList.push({
                                        name: songName,
                                        user_id: userID,
                                        song_id: songs[reEscape(songName)].id,
                                        rate: songs[reEscape(songName)][difficulty],
                                        difficulty: difficulty,
                                        score: parseInt(score),
                                    })
                                }
                            }

                        }
                    }

                }



            }).catch(e => {
                console.log('calculateRating', e)
                alert('fail')
            });
    }

    function openRatingTable() {

        let { ratingList, totalRate } = ratingInfo;
        if (ratingList.length <= 0) return
        let tableRow = '';
        for (let l = 0; l < (ratingList.length); l++) {

            tableRow +=
                `<tr>
            <td>${l + 1}</td>
            <td style="min-width : 50%">${ratingList[l].name}</td>
            <td>${ratingList[l].score}</td>
            <td>${(Math.trunc(ratingList[l].rate * 100) / 100).toFixed(2)}</td>
         </tr>`
        }

        $('body').append(
            `<div id='rating-table' >
            <div style="margin-bottom:10px">
            <div class="closeBtn"  onclick='removeTable()'>
            <span style="width: 100%;height: 3px; transform: translateY(8px) rotate(45deg);;background-color: black;"></span>
            <span style="width:  100%;height: 3px;transform: translateY(5px) rotate(135deg);background-color: black;"></span>
            </div>
                ${"Average Rating: " + (Math.trunc(totalRate / 30 * 100) / 100).toFixed(2)}
                <div style='float:right'>
                    <input id='top30' type='checkbox' onclick='handleClick(this);'> <label for="top30">Top30</label>
                </div>

            </div>
             <table style="width:100%;">
                 <tbody>
                    ${tableRow}
                 </tbody>
             </table>
         </div>`)
    }


    async function init() {

        fetch("http://localhost:3000/api/songs", {
            method: "GET",
            headers: { "Content-Type": "application/json" },
        }).then(r => r.json()).then(async r => {
            const songs = r
            // console.log("🚀 ~ file: calculateRating.js ~ line 117 ~ init ~ songs", songs['ナイト・オブ・ナイツ(かめりあs"ワンス・アポン・ア・ナイト"Remix)'])
            for (let i = 0; i < difficultyList.length; i++) {
                await getScoreList(difficultyList[i], songs)
            }
            if (scoreList.length <= 0) return
            console.table(scoreList)
            fetch("http://localhost:3000/api/record/update", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: scoreList, user_id: userID }),
            })
                .then((r) => r.text()).then(r => {
                    console.log("🚀 ~ file: calculateRating.js ~ line 120 ~ .then ~ r", r)
                    window.open('http://localhost:3000/home')
                })

        }).catch(e => {
            alert(e)
        })

    }

    init()
})();

// function removeTable() {

//     $('#rating-table').hide()
//     $('.sleep_penguin').show()
//     $('.sleep_penguin').css({
//         'transition': 'all 2s',
//         'transform': 'rotate(360deg) scale(.5)',
//         'bottom': '10px', 'opacity': 1,
//     })
//     $('.sleep_penguin').one('transitionend', () => {
//         $('.sleep_penguin').css({
//             'animation': 'sleep 3s ease-out infinite alternate'
//         })
//     })

// }

// function handleClick(e) {
//     let tableRow = $('#rating-table > table > tbody > tr')

//     for (let i = 30; i < tableRow.length; i++) {
//         tableRow.get(i).style.display = e.checked ? 'none' : 'table-row'

//     }

// }
