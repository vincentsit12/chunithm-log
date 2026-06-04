import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import { Op } from "sequelize";
import withErrorHandler from "utils/errorHandler";
import Songs, { MaimaiSongs } from "db/model/songs";
import Playlists from "db/model/playlists";
import PlaylistItems from "db/model/playlistItems";
import PlaylistItemSegments from "db/model/playlistItemSegments";
import { BadRequestError } from "@/errors/BadRequestError";
import { CustomSong, GuessGameSong } from "@/games/GuessSongGame/types";

type PlaylistLoadMode =
  | "catalog_chunithm"
  | "catalog_maimai"
  | "youtube_playlist"
  | "custom";

type PlaylistLoadResponse = {
  songs: GuessGameSong[];
  mode: PlaylistLoadMode;
  playlistId: string;
};

const getBaseUrl = (req: NextApiRequest) => {
  const protocol = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = req.headers.host || "localhost:3000";
  return `${protocol}://${host}`;
};

const mapSystemChunithmSongs = async (minLevel: number) => {
  const data = await Songs.findAll({
    attributes: ["id", "genre", "display_name", "master", "ultima", "expert"],
    where: {
      [Op.or]: [
        { "master.rate": { [Op.gte]: minLevel } },
        { "ultima.rate": { [Op.gte]: minLevel } },
        { "expert.rate": { [Op.gte]: minLevel } },
      ],
    },
  });
  return data as GuessGameSong[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PlaylistLoadResponse>,
) {
  const playlistId = String(req.query.id || "");
  if (!playlistId) {
    throw new BadRequestError("Playlist id is required");
  }

  if (playlistId === "system:chunithm") {
    const songs = await mapSystemChunithmSongs(13);
    res.status(200).json({
      songs,
      mode: "catalog_chunithm",
      playlistId,
    });
    return;
  }

  if (playlistId === "system:maimai") {
    const maimaiSongs = await axios.get<MaimaiSongs[]>(
      `${getBaseUrl(req)}/api/songs/maimaiSongList`,
    );
    res.status(200).json({
      songs: maimaiSongs.data,
      mode: "catalog_maimai",
      playlistId,
    });
    return;
  }

  const playlist = await Playlists.findByPk(playlistId);
  if (!playlist) {
    throw new BadRequestError("Playlist not found");
  }

  const playlistItems = await PlaylistItems.findAll({
    where: { playlist_id: playlistId },
    order: [
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  });

  const segmentRows = await PlaylistItemSegments.findAll({
    where: {
      playlist_item_id: playlistItems.map((k) => k.id),
    },
    order: [
      ["sort_order", "ASC"],
      ["id", "ASC"],
    ],
  });
  const segmentMap = segmentRows.reduce<Record<number, PlaylistItemSegments[]>>(
    (acc, seg) => {
      if (!acc[seg.playlist_item_id]) acc[seg.playlist_item_id] = [];
      acc[seg.playlist_item_id].push(seg);
      return acc;
    },
    {},
  );

  const songIdItems = playlistItems
    .filter((k) => k.song_id)
    .map((k) => k.song_id as number);
  const songsFromDb = await Songs.findAll({
    where: { id: songIdItems },
  });
  const songsById = songsFromDb.reduce<Record<number, Songs>>((acc, song) => {
    acc[song.id] = song;
    return acc;
  }, {});

  let hasSegment = false;
  const songs: GuessGameSong[] = [];
  playlistItems.forEach((item) => {
    const segments = segmentMap[item.id] || [];
    if (segments.length > 0 && item.youtube_id) {
      hasSegment = true;
      segments.forEach((seg) => {
        songs.push({
          id: seg.id,
          youtube_link: item.youtube_id!,
          display_name: seg.answer_name,
          startTime: seg.start_sec,
        } as CustomSong);
      });
      return;
    }

    if (item.song_id && songsById[item.song_id]) {
      songs.push(songsById[item.song_id]);
      return;
    }

    if (item.youtube_id) {
      songs.push({
        id: item.id,
        display_name: item.display_name,
        youtube_link: item.youtube_id,
        startTime: 0,
      } as CustomSong);
    }
  });

  const mode: PlaylistLoadMode = hasSegment
    ? "custom"
    : playlist.source_type === "youtube_playlist"
      ? "youtube_playlist"
      : "youtube_playlist";

  res.status(200).json({
    songs,
    mode,
    playlistId,
  });
}

export default withErrorHandler(handler);
