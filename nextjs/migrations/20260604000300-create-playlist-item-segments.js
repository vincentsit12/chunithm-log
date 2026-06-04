"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("playlist_item_segments", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      playlist_item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: "playlist_items",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      answer_name: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      start_sec: {
        type: Sequelize.FLOAT,
        allowNull: false,
      },
      end_sec: {
        type: Sequelize.FLOAT,
        allowNull: true,
      },
      metadata: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal("NOW()"),
      },
    });

    await queryInterface.addIndex("playlist_item_segments", ["playlist_item_id"]);
    await queryInterface.addIndex("playlist_item_segments", [
      "playlist_item_id",
      "sort_order",
    ]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("playlist_item_segments");
  },
};
