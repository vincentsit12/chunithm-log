const models = require('./models')
const { sequelize: db, users: Users, records: Records, songs: Songs } = models;
const _ = require('lodash')
const { getRating } = require('./scrapper');
var cron = require('node-cron');
const { getGameScript } = require('./getGameScript');



async function createSchedule() {
    try {
        const updateDB = async () => {
            await db.authenticate();
            let ratingList = await getRating()

            let newData = _.toPairs(ratingList).map((k) => {
                return {
                    name: k[0],
                    display_name: k[1].displayName,
                    master: k[1].master || null,
                    ultima: k[1].ultima || null,
                    expert: k[1].expert || null,
                }
            })
            const songs = await Songs.findAll()

            for (let i = 0; i < newData.length; i++) {
                let index = _.findIndex(songs, k => k.name === newData[i].name)
                if (index >= 0) {
                    newData[i].id = songs[index].id
                }
            }
            console.table(newData)
            await Songs.bulkCreate(newData,
                {
                    updateOnDuplicate: ['display_name', 'master', 'expert', 'ultima', 'updatedAt'],
                });
        }
        await updateDB()
        console.log('--------- scheduler start ----------')
        cron.schedule('0 3 1 * *', async () => {
            console.log('scheduled task');
            await updateDB()
        });
    } catch (e) {
        console.log(e);
    }


}


async function updateGameScript() {
    try {
        const updateDB = async () => {
            await db.authenticate();
            let gameScriptList = await getGameScript()

            const songs = await Songs.findAll()


            let newData = []
            let key = Object.keys(gameScriptList)
            const diffculty = ["master", "ultima", "expert"]
            for (let i = 0; i < key.length; i++) {
                let obj = gameScriptList[key[i]]
                let index = _.findIndex(songs, k => k.name === obj.name)
                if (index >= 0) {
                    let song = _.omit({ ...songs[index].dataValues,}, "updatedAt")
                    let count = 0
                    diffculty.forEach(k => {
                        if (song[k] && obj[k] && !song[k].scriptUrl) {
                            song[k] = {
                                ...song[k],
                                scriptUrl: obj[k]
                            }
                            count++
                        }
                    })
                    if (count > 0)
                        newData.push(song)

                }
                else {
                    console.log(key[i])
                }
            }

            await Songs.bulkCreate(newData,
                {
                    updateOnDuplicate: ['master', 'expert', 'ultima', 'updatedAt'],
                });
        }
        await updateDB()
        // console.log('--------- scheduler start ----------')
        // cron.schedule('0 3 1 * *', async () => {
        //     console.log('scheduled task');
        //     await updateDB()
        // });
    } catch (e) {
        console.log(e);
    }


}


// createSchedule()
updateGameScript()
