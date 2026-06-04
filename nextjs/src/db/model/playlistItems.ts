import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "..";
import Playlists from "./playlists";
import Songs from "./songs";

export type PlaylistItemType = "youtube_video" | "song_ref";

type PlaylistItemAttributes = {
  id: number;
  playlist_id: string;
  sort_order: number;
  item_type: PlaylistItemType;
  song_id?: number;
  youtube_id?: string;
  display_name: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
};

type PlaylistItemCreationAttributes = Optional<
  PlaylistItemAttributes,
  "id" | "song_id" | "youtube_id" | "metadata" | "createdAt" | "updatedAt"
>;

export default class PlaylistItems extends Model<
  PlaylistItemAttributes,
  PlaylistItemCreationAttributes
> {
  declare id: number;
  declare playlist_id: string;
  declare sort_order: number;
  declare item_type: PlaylistItemType;
  declare song_id?: number;
  declare youtube_id?: string;
  declare display_name: string;
  declare metadata?: Record<string, unknown>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PlaylistItems.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    playlist_id: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    item_type: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "youtube_video",
    },
    song_id: {
      type: DataTypes.INTEGER,
    },
    youtube_id: {
      type: DataTypes.TEXT,
    },
    display_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
    },
    createdAt: {
      type: DataTypes.DATE,
    },
    updatedAt: {
      type: DataTypes.DATE,
    },
  },
  {
    sequelize,
    modelName: "playlist_items",
  },
);

Playlists.hasMany(PlaylistItems, { foreignKey: "playlist_id" });
PlaylistItems.belongsTo(Playlists, { foreignKey: "playlist_id" });
PlaylistItems.belongsTo(Songs, { foreignKey: "song_id" });
