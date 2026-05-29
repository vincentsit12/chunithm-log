import axios from "axios";
import { useRouter } from "next/router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import _, { isInteger, isString } from "lodash";
import { MdGames } from "react-icons/md";
import Head from "next/head";
import { Button } from "@/components/ui/Button";
import { BackdropScene } from "@/components/ui/BackdropScene";
import { SongGuesserLogo } from "@/components/ui/SongGuesserLogo";

interface Room {
  roomID: string;
  playerCount: number;
}

const GameRoomList = () => {
  const [roomList, setRoomList] = useState<Room[]>([]);
  const router = useRouter();

  useEffect(() => {
    getRoomList();
  }, []);

  const getRoomList = async () => {
    let res = await axios.get<Room[]>("/api/game/rooms");
    setRoomList(res.data);
  };

  const joinRoom = async (roomID: string) => {
    let res = await axios.get<Room[]>("/api/game/rooms");
    if (res.data.findIndex((k) => k.roomID == roomID) > -1) {
      router.push(`./rooms/${roomID}`);
    } else {
      alert("This room has been deleted!");
      setRoomList(res.data);
    }
  };

  const createRoom = async (roomID: string) => {
    let res = await axios.get<Room[]>("/api/game/rooms");
    if (res.data.findIndex((k) => k.roomID == roomID) > -1) {
      alert("This room has been created!");
      setRoomList(res.data);
    } else {
      router.push(`./rooms/${roomID}`);
    }
  };

  const _renderTableRow = () => {
    return _.map(roomList, (k, i) => {
      return (
        <tr
          key={i}
          className="border-t border-white/5 text-slate-100 transition-colors duration-200 even:bg-slate-300/10 hover:bg-violet-500/15"
        >
          {/* <td className='w-10'>{k.id}</td> */}
          <td className="py-4 text-white font-medium">{k.roomID}</td>
          <td className="w-20 py-4 text-slate-300">{k.playerCount}</td>
          <td
            className="w-40 text-right"
            onClick={() => {
              joinRoom(k.roomID);
            }}
          >
            <Button className="min-w-0 px-5 py-2">Join</Button>
          </td>
        </tr>
      );
    });
  };
  return (
    <div className="relative min-h-screen overflow-hidden">
      <BackdropScene />
      <Head>
        <title>So♫Guesser</title>
      </Head>
      <div className="relative z-10 mx-auto max-w-4xl px-4 py-8 text-center">
        <div className="w-full my-8">
          {/* Header */}
          <div className="mb-12">
            <SongGuesserLogo className="mb-6" />
          </div>

          <Button
            onClick={() => {
              let roomName = prompt("Please enter a room name");
              if (roomName) {
                createRoom(roomName);
              }
            }}
            className="mb-8 text-lg"
          >
            Create Room
          </Button>

          <div className="guess-song-game-box overflow-hidden">
            <div className="min-h-[500px] p-6">
              <table className="text-left w-full">
                <thead>
                  <tr className="border-b border-white/10 text-xs font-semibold uppercase tracking-[0.18em] text-slate-300 sm:text-sm">
                    {/* <th >id</th> */}
                    <th className="pb-4">Room Name</th>
                    <th className="w-20 pb-4">Players</th>
                    <th className="w-40 pb-4 text-right">Open</th>
                  </tr>
                </thead>
                <tbody>
                  {roomList.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="text-center py-12">
                        <div className="text-slate-300 text-lg">
                          <div className="mb-4">
                            <MdGames className="w-16 h-16 mx-auto text-slate-500 mb-4" />
                          </div>
                          No rooms available
                          <p className="text-sm text-slate-400 mt-2">
                            Create a room to get started!
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    _renderTableRow()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameRoomList;
