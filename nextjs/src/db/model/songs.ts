import { DataTypes, Model, Optional } from "sequelize";
import { MaimaiSongGenre, Song, SongGenre } from "types";
import { sequelize } from "..";


type SongAttributes = {
    id: number,
    name: string
    display_name: string
    master?: Song,
    expert?: Song,
    ultima?: Song,
    youtube_link?: string
    genre: SongGenre,
    // other attributes...
};
export interface MaimaiSongs extends Omit<SongAttributes, 'genre'> {
    artist: string,
    version: string,
    genre : MaimaiSongGenre
    remaster? : Song
}
type SongCreationAttributes = Optional<SongAttributes, 'id'>;

export default class Songs extends Model<SongAttributes, SongCreationAttributes> {
    declare id: number;
    declare name: string;
    declare display_name: string;
    declare master?: Song;
    declare expert?: Song;
    declare ultima?: Song;
    declare youtube_link?: string;
    declare genre: SongGenre;
}

Songs.init({
    // Model attributes are defined here
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    name: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    display_name: { type: DataTypes.TEXT, },
    master: {
        type: DataTypes.JSONB,
    },
    ultima: {
        type: DataTypes.JSONB,
    },
    expert: {
        type: DataTypes.JSONB,
    },

    youtube_link: {
        type: DataTypes.TEXT,
    },

    genre: {
        type: DataTypes.TEXT,
    }

}, {
    // Other model options go here
    sequelize, // We need to pass the connection instance
    modelName: 'songs' // We need to choose the model name
});