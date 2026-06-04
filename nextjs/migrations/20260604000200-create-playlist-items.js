"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("playlist_items", {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true,
      },
      playlist_id: {
        type: Sequelize.STRING,
        allowNull: false,
        references: {
          model: "playlists",
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
      item_type: {
        type: Sequelize.TEXT,
        allowNull: false,
        defaultValue: "youtube_video",
      },
      song_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: "songs",
          key: "id",
        },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
      },
      youtube_id: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      display_name: {
        type: Sequelize.TEXT,
        allowNull: false,
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

    await queryInterface.addIndex("playlist_items", ["playlist_id"]);
    await queryInterface.addIndex("playlist_items", ["song_id"]);
    await queryInterface.addIndex("playlist_items", ["playlist_id", "sort_order"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("playlist_items");
  },
};
