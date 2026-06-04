import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "..";
import PlaylistItems from "./playlistItems";

type PlaylistItemSegmentAttributes = {
  id: number;
  playlist_item_id: number;
  sort_order: number;
  answer_name: string;
  start_sec: number;
  end_sec?: number;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
};

type PlaylistItemSegmentCreationAttributes = Optional<
  PlaylistItemSegmentAttributes,
  "id" | "end_sec" | "metadata" | "createdAt" | "updatedAt"
>;

export default class PlaylistItemSegments extends Model<
  PlaylistItemSegmentAttributes,
  PlaylistItemSegmentCreationAttributes
> {
  declare id: number;
  declare playlist_item_id: number;
  declare sort_order: number;
  declare answer_name: string;
  declare start_sec: number;
  declare end_sec?: number;
  declare metadata?: Record<string, unknown>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

PlaylistItemSegments.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    playlist_item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    answer_name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    start_sec: {
      type: DataTypes.FLOAT,
      allowNull: false,
    },
    end_sec: {
      type: DataTypes.FLOAT,
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
    modelName: "playlist_item_segments",
  },
);

PlaylistItems.hasMany(PlaylistItemSegments, { foreignKey: "playlist_item_id" });
PlaylistItemSegments.belongsTo(PlaylistItems, { foreignKey: "playlist_item_id" });
