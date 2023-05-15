'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('songs', {
      name: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      display_name: { type: Sequelize.TEXT, },
      master: {
        type: Sequelize.JSONB,
      },
      ultima: {
        type: Sequelize.JSONB,
      },
      expert: {
        type: Sequelize.JSONB,
      },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('songs');
  }
};