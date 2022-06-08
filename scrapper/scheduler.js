const Songs = require('./Songs')
const _ = require('lodash')
const sequelize = require('./db');
const { getRating } = require('./scrapper');
var cron = require('node-cron');





console.log('--------- scheduler start ----------')
cron.schedule('0 3 1 * *', async () => {
    console.log('scheduled task');
    await sequelize.authenticate();
    let ratingList = await getRating()

    let values = _.toPairs(ratingList).map((k) => {
        // if (k[0].includes('\)'))
        // console.log(123)
        return {
            name: k[0],
            master: k[1].master || null,
            ultima: k[1].ultima || null,
            expert: k[1].expert || null,
        }

    })
    await Songs.destroy({ where: {}, force: true })
    await Songs.bulkCreate(values,
        {
            updateOnDuplicate: ['master', 'expert', 'ultima'],
        });
});



