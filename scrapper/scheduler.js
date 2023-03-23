const Songs = require('./Songs')
const _ = require('lodash')
const sequelize = require('./db');
const { getRating } = require('./scrapper');
var cron = require('node-cron');



async function createSchedule() {
    try {
        const updateDB = async () => {
            await sequelize.authenticate();
            let ratingList = await getRating()

            let values = _.toPairs(ratingList).map((k) => {
                // if (k[0].includes('\)'))
                return {
                    name: k[0],
                    display_name: k[1].displayName,
                    master: k[1].master || null,
                    ultima: k[1].ultima || null,
                    expert: k[1].expert || null,
                }

            })
            const songs = await Songs.findAll()

            for (let i = 0; i < values.length; i++) {
                let index = _.findIndex(songs, k => k.name === values[i].name)
                if (index >= 0) {
                    values[i].id = songs[index].id
                }

            }
            // console.log("🚀 ~ file: scheduler.js:32 ~ updateDB ~ values:", values)

            // const fs = require('fs')
            // fs.writeFileSync('test3.json', JSON.stringify(values))

            await Songs.bulkCreate(values,
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


createSchedule()
