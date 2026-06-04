import type { NextApiRequest, NextApiResponse } from "next";
import axios from "axios";
import withErrorHandler from "utils/errorHandler";
import { BadRequestError } from "@/errors/BadRequestError";
import Playlists from "db/model/playlists";
import PlaylistItems from "db/model/playlistItems";

type ImportYoutubeBody = {
  playlistUrlOrId: string;
};

type YoutubeSong = {
  display_name: string;
  youtube_link: string;
};

const getBaseUrl = (req: NextApiRequest) => {
  const protocol = (req.headers["x-forwarded-proto"] as string) || "http";
  const host = req.headers.host || "localhost:3000";
  return `${protocol}://${host}`;
};

const getPlaylistId = (value: string) => {
  try {
    const url = new URL(value);
    return url.searchParams.get("list") || value;
  } catch {
    return value;
  }
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ importedCount: number; playlistId: string }>,
) {
  if (req.method !== "POST") {
    throw new BadRequestError(`Unsupported method: ${req.method}`);
  }

  const playlistId = String(req.query.id || "");
  const body = req.body as ImportYoutubeBody;
  const youtubePlaylistId = getPlaylistId(body.playlistUrlOrId || "");

  if (!playlistId || !youtubePlaylistId) {
    throw new BadRequestError("Playlist id and playlist URL/ID are required");
  }

  const playlist = await Playlists.findByPk(playlistId);
  if (!playlist) {
    throw new BadRequestError("Playlist not found");
  }

  const songs = await axios.get<YoutubeSong[]>(
    `${getBaseUrl(req)}/api/songs/playlist?id=${youtubePlaylistId}`,
  );
  const existingCount = await PlaylistItems.count({ where: { playlist_id: playlistId } });

  await PlaylistItems.bulkCreate(
    songs.data.map((song, idx) => ({
      playlist_id: playlistId,
      sort_order: existingCount + idx,
      item_type: "youtube_video" as const,
      youtube_id: song.youtube_link,
      display_name: song.display_name,
    })),
  );

  playlist.source_type = "youtube_playlist";
  playlist.source_ref = youtubePlaylistId;
  await playlist.save();

  res.status(200).json({
    importedCount: songs.data.length,
    playlistId,
  });
}

export default withErrorHandler(handler);
