
const Songs = require('./Songs')
const Users = require('./Users')
const sequelize = require('./db')
const bcrypt = require('bcryptjs');
const Records = require('./Records');
const _ = require('lodash');
const { getRating } = require('./scrapper');


async function initDB() {

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
    try {
        await sequelize.authenticate();
        Users.hasMany(Records, { foreignKey: 'user_id' })
        Records.belongsTo(Users, { foreignKey: 'user_id' })
        Records.belongsTo(Songs, { foreignKey: 'song_id' })
        await sequelize.sync({})
        console.log('Connection has been established successfully.');
        await Songs.bulkCreate(values,
            {
                updateOnDuplicate: ['master', 'expert', 'ultima'],
            });

        let pwd = bcrypt.hashSync('tt97101505', 10)

        await Users.create({ username: 'admin0129', password: pwd, isAdmin: true })

        // await Records.create({ user_id: 1, song_id: 2, diffculty: 'master', score: 1007500 })

        // let x = (await Users.findOne({ where: { id: 1 }, include: { model: Records, include: { model: Songs, } } })).toJSON()

        console.log('migrate finished')
        await sequelize.close()
    } catch (error) {
        console.error('somethin went wrong', error);
    }

}

initDB()