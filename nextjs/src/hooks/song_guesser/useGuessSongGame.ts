import { useEffect, useRef } from "react";
import type { Socket } from "socket.io-client";
import type { MessageDetails } from "types";
import type {
  GuessGameSong,
  GuessSongGameOption,
  RoomInfo,
} from "@/games/GuessSongGame/types";

type MessageHandler = (
  message: string,
  messageDetails?: MessageDetails,
) => void;

interface UseGuessSongGameProps {
  socket: Socket | null;
  state: boolean;
  roomID: string | string[] | undefined;
  playerName?: string;
  isHost: boolean;
  isJoined: boolean;
  onBecomeHost: () => void;
  onRoomDeleted: () => void;
  onRoomLeft: () => void;
  onMessage: MessageHandler;
  onUpdateRoomInfo: (roomInfo: RoomInfo) => void;
  onChangeSongList: (songList: GuessGameSong[]) => void;
  onReplayMusic: () => void;
  onPlayMusic: () => void;
  onBufferMusic: (newGameOption: GuessSongGameOption) => void;
  onRequestReplay: (playerName: string) => void;
  onRequestLonger: (playerName: string) => void;
  onRequestAnotherSection: (playerName: string) => void;
}

export function useGuessSongGame({
  socket,
  state,
  roomID,
  playerName,
  isHost,
  isJoined,
  onBecomeHost,
  onRoomDeleted,
  onRoomLeft,
  onMessage,
  onUpdateRoomInfo,
  onChangeSongList,
  onReplayMusic,
  onPlayMusic,
  onBufferMusic,
  onRequestReplay,
  onRequestLonger,
  onRequestAnotherSection,
}: UseGuessSongGameProps) {
  const normalizedRoomID = Array.isArray(roomID) ? roomID[0] : roomID;
  const onBecomeHostRef = useRef(onBecomeHost);
  const onRoomDeletedRef = useRef(onRoomDeleted);

  useEffect(() => {
    onBecomeHostRef.current = onBecomeHost;
  }, [onBecomeHost]);

  useEffect(() => {
    onRoomDeletedRef.current = onRoomDeleted;
  }, [onRoomDeleted]);

  useEffect(() => {
    if (!state && !isHost && isJoined) {
      onRoomLeft();
    }
  }, [state, isHost, isJoined, onRoomLeft]);

  useEffect(() => {
    if (!socket || !normalizedRoomID) return;

    socket.emit(
      "create-room",
      { roomID: normalizedRoomID, playerName },
      (hostResult: boolean) => {
        if (hostResult) {
          onBecomeHostRef.current();
        }
      },
    );

    const handleDeleteRoom = () => {
      onRoomDeletedRef.current();
    };

    socket.on("delete-room", handleDeleteRoom);

    return () => {
      socket.off("delete-room", handleDeleteRoom);
    };
  }, [socket, normalizedRoomID, playerName]);

  useEffect(() => {
    if (!socket || !isHost) return;

    socket.on("request-replay", onRequestReplay);
    socket.on("request-longer", onRequestLonger);
    socket.on("request-another-section", onRequestAnotherSection);

    return () => {
      socket.off("request-replay", onRequestReplay);
      socket.off("request-longer", onRequestLonger);
      socket.off("request-another-section", onRequestAnotherSection);
    };
  }, [
    socket,
    isHost,
    onRequestReplay,
    onRequestLonger,
    onRequestAnotherSection,
  ]);

  useEffect(() => {
    if (!socket) return;

    socket.on("message", onMessage);
    socket.on("update-room-info", onUpdateRoomInfo);
    socket.on("change-song-list", onChangeSongList);
    socket.on("replay-music", onReplayMusic);
    socket.on("play-music", onPlayMusic);
    socket.on("buffer-music", onBufferMusic);

    return () => {
      socket.off("message", onMessage);
      socket.off("update-room-info", onUpdateRoomInfo);
      socket.off("change-song-list", onChangeSongList);
      socket.off("replay-music", onReplayMusic);
      socket.off("play-music", onPlayMusic);
      socket.off("buffer-music", onBufferMusic);
    };
  }, [
    socket,
    onMessage,
    onUpdateRoomInfo,
    onChangeSongList,
    onReplayMusic,
    onPlayMusic,
    onBufferMusic,
  ]);
}
