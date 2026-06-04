import type { NextApiRequest, NextApiResponse } from "next";
import withErrorHandler from "utils/errorHandler";
import Playlists, { PlaylistSourceType } from "db/model/playlists";
import { BadRequestError } from "@/errors/BadRequestError";

const SYSTEM_PLAYLISTS = [
  {
    id: "system:chunithm",
    name: "Chunithm (System)",
    creator: "system",
    source_type: "catalog_chunithm",
    source_ref: "songs",
  },
  {
    id: "system:maimai",
    name: "Maimai (System)",
    creator: "system",
    source_type: "catalog_maimai",
    source_ref: "maimaiSongList",
  },
];

const generatePlaylistId = () =>
  `pl_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

type CreatePlaylistBody = {
  id?: string;
  name: string;
  creator?: string;
  source_type?: PlaylistSourceType;
  source_ref?: string;
  metadata?: Record<string, unknown>;
};

async function handler(
  req: NextApiRequest,
  res: NextApiResponse<Playlists[] | Playlists>,
) {
  if (req.method === "GET") {
    const dbPlaylists = await Playlists.findAll({
      order: [["updatedAt", "DESC"]],
    });
    res.status(200).json([...SYSTEM_PLAYLISTS, ...dbPlaylists] as unknown as Playlists[]);
    return;
  }

  if (req.method === "POST") {
    const body = req.body as CreatePlaylistBody;
    if (!body.name?.trim()) {
      throw new BadRequestError("Playlist name is required");
    }

    const playlistId = body.id?.trim() || generatePlaylistId();
    if (playlistId.startsWith("system:")) {
      throw new BadRequestError("`system:` prefix is reserved");
    }

    const existing = await Playlists.findByPk(playlistId);
    if (existing) {
      throw new BadRequestError("Playlist id already exists");
    }

    const created = await Playlists.create({
      id: playlistId,
      name: body.name.trim(),
      creator: body.creator || "anonymous",
      source_type: body.source_type || "manual_custom",
      source_ref: body.source_ref,
      metadata: body.metadata,
    });

    res.status(200).json(created);
    return;
  }

  throw new BadRequestError(`Unsupported method: ${req.method}`);
}

export default withErrorHandler(handler);
