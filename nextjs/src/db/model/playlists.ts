import { DataTypes, Model, Optional } from "sequelize";
import { sequelize } from "..";

export type PlaylistSourceType =
  | "catalog_chunithm"
  | "catalog_maimai"
  | "youtube_playlist"
  | "manual_custom";

type PlaylistAttributes = {
  id: string;
  name: string;
  creator: string;
  source_type: PlaylistSourceType;
  source_ref?: string;
  metadata?: Record<string, unknown>;
  createdAt?: Date;
  updatedAt?: Date;
};

type PlaylistCreationAttributes = Optional<
  PlaylistAttributes,
  "source_ref" | "metadata" | "createdAt" | "updatedAt"
>;

export default class Playlists extends Model<
  PlaylistAttributes,
  PlaylistCreationAttributes
> {
  declare id: string;
  declare name: string;
  declare creator: string;
  declare source_type: PlaylistSourceType;
  declare source_ref?: string;
  declare metadata?: Record<string, unknown>;
  declare createdAt: Date;
  declare updatedAt: Date;
}

Playlists.init(
  {
    id: {
      type: DataTypes.STRING,
      primaryKey: true,
      allowNull: false,
    },
    name: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    creator: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: "system",
    },
    source_type: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    source_ref: {
      type: DataTypes.TEXT,
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
    modelName: "playlists",
  },
);
