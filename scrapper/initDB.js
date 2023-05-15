
const models = require('./models')


const bcrypt = require('bcryptjs');
const _ = require('lodash');
const { Op } = require("sequelize");

// const { getRating } = require('./scrapper');

const { sequelize : db, users : Users , records : Records  , songs : Songs} = models;

async function initDB() {

    // let ratingList = await getRating()

    // let values = _.toPairs(ratingList).map((k) => {
    //     // if (k[0].includes('\)'))
    //     // console.log(123)
    //     return {
    //         name: k[0],
    //         display_name: k[1].displayName,
    //         master: k[1].master || null,
    //         ultima: k[1].ultima || null,
    //         expert: k[1].expert || null,
    //     }

    // })
    try {
        await db.authenticate();

        // Users.hasMany(Records, { foreignKey: 'user_id' })
        // Records.belongsTo(Users, { foreignKey: 'user_id' })
        // Records.belongsTo(Songs, { foreignKey: 'song_id' })
        // await sequelize.sync({ alter: true })
        console.log('Connection has been established successfully.');

        let count = await Users.findAll()
        console.log("🚀 ~ file: init.js ~ line 40 ~ initDB ~ count", count)
        // let z = await Songs.destroy({where : {display_name : ['1', `WORLD'S END`, `無印`, 'NEW', "マップボーナス・限界突破", 'スキル比較', '称号', "マップ一覧" ]}})

        // let x = (await Users.findOne({ where: { id: 5 }, include: { model: Records, include: { model: Songs, } } }))

        await db.close()
    } catch (error) {
        console.error('somethin went wrong', error);
    }

}

initDB()