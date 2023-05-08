
const Songs = require('./Songs')
const Users = require('./Users')
const sequelize = require('./db')
const bcrypt = require('bcryptjs');
const Records = require('./Records');
const _ = require('lodash');
const { Op } = require("sequelize");

// const { getRating } = require('./scrapper');


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
        await sequelize.authenticate();
        Users.hasMany(Records, { foreignKey: 'user_id' })
        Records.belongsTo(Users, { foreignKey: 'user_id' })
        Records.belongsTo(Songs, { foreignKey: 'song_id' })
        // await sequelize.sync({ alter: true })
        console.log('Connection has been established successfully.');
        // await Songs.bulkCreate(values,
        //     {
        //         updateOnDuplicate: ['master', 'expert', 'ultima'],
        //     });

        // await Songs.destroy({ where: { id: 504 } })
        let count = await Songs.findAll({ where: { display_name: { [Op.like]: "%SUP3%" } } })
        console.log("🚀 ~ file: init.js ~ line 40 ~ initDB ~ count", count)
        // let z = await Songs.destroy({where : {display_name : ['1', `WORLD'S END`, `無印`, 'NEW', "マップボーナス・限界突破", 'スキル比較', '称号', "マップ一覧" ]}})

        // await Users.destroy({ where: { id: 1 }, force: true })

        // let x = (await Users.findOne({ where: { id: 1 }, include: { model: Records, include: { model: Songs, } } })).toJSON()

        console.log('migrate finished')
        await sequelize.close()
    } catch (error) {
        console.error('somethin went wrong', error);
    }

}

initDB()