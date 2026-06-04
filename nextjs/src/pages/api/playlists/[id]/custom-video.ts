import type { NextApiRequest, NextApiResponse } from "next";
import withErrorHandler from "utils/errorHandler";
import { BadRequestError } from "@/errors/BadRequestError";
import Playlists from "db/model/playlists";
import PlaylistItems from "db/model/playlistItems";
import PlaylistItemSegments from "db/model/playlistItemSegments";

type CustomSegmentInput = {
  answer_name: string;
  start_sec: number;
  end_sec?: number;
};

type CreateCustomVideoBody = {
  youtube_id: string;
  display_name?: string;
  segments: CustomSegmentInput[];
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<{ playlistItemId: number; segmentCount: number }>,
) {
  if (req.method !== "POST") {
    throw new BadRequestError(`Unsupported method: ${req.method}`);
  }

  const playlistId = String(req.query.id || "");
  const body = req.body as CreateCustomVideoBody;
  if (!playlistId || !body.youtube_id) {
    throw new BadRequestError("Playlist id and youtube_id are required");
  }

  const playlist = await Playlists.findByPk(playlistId);
  if (!playlist) {
    throw new BadRequestError("Playlist not found");
  }

  const segments = (body.segments || [])
    .filter((seg) => seg.answer_name?.trim().length > 0)
    .sort((a, b) => a.start_sec - b.start_sec);
  if (segments.length <= 0) {
    throw new BadRequestError("At least one segment is required");
  }

  const existingCount = await PlaylistItems.count({ where: { playlist_id: playlistId } });
  const playlistItem = await PlaylistItems.create({
    playlist_id: playlistId,
    sort_order: existingCount,
    item_type: "youtube_video",
    youtube_id: body.youtube_id,
    display_name: body.display_name || "Custom Segments",
  });

  await PlaylistItemSegments.bulkCreate(
    segments.map((seg, idx) => ({
      playlist_item_id: playlistItem.id,
      sort_order: idx,
      answer_name: seg.answer_name,
      start_sec: seg.start_sec,
      end_sec: seg.end_sec,
    })),
  );

  playlist.source_type = "manual_custom";
  await playlist.save();

  res.status(200).json({
    playlistItemId: playlistItem.id,
    segmentCount: segments.length,
  });
}

export default withErrorHandler(handler);
