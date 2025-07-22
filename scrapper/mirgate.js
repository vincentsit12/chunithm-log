
const sequelize = require('./db')


async function migrate() {
    try {
        await sequelize.authenticate();
        Users.hasMany(Records, { foreignKey: 'user_id' })
        Records.belongsTo(Users, { foreignKey: 'user_id' })
        Records.belongsTo(Songs, { foreignKey: 'song_id' })
        await sequelize.sync({ alter: true })

        console.log('migrate finished')
        await sequelize.close()
    }
    catch (error) {
        await sequelize.close()
        console.error('somethin went wrong', error);
    }
}


migrate()

module.exports = { migrate }