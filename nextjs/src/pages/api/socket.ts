import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import type { NextApiRequest, NextApiResponse } from "next"
import type { Server as IOServer } from "socket.io"
import { Server } from "socket.io"

const PORT = 3000
export const config = {
  api: {
    bodyParser: false,
  },
}

interface SocketServer extends HTTPServer {
  io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
  server: SocketServer
}

interface NextApiResponseWithSocket extends NextApiResponse {
  socket: SocketWithIO
}

export default function SocketHandler(_req: NextApiRequest, res: NextApiResponseWithSocket) {
  if (res.socket.server.io) {
    console.log("Socket is already running")
    res.status(200).json({ success: true, message: "Socket is already running", socket: `:${PORT + 1}` })
    return
  }

  const io = new Server(res.socket.server, {
    addTrailingSlash: false
  })

  io.on("connection", socket => {
    console.log(socket.id, ": socket connect", socket.handshake.query.roomID)

    socket.on("disconnecting", async () => {
      console.log(socket.id, ": socket disconnect")

      let x = io.of('/').adapter.sids.get(socket.id)
      x?.forEach((k) => {
        if (rooms.has(k)) {
          let room = rooms.get(k)
          let player = room?.players.get(socket.id)
          if (room && player) {
            room.removePlayer(socket.id)
            if (player.isHost) {
              // todo
              rooms.delete(k)
              io.in(room.roomID).emit("delete-room")
            }
          }
        }
      })
      console.log("delete ", rooms)
    })

    socket.on("message", async (data: RoomEvent, message) => {
      let roomID = data.roomID
      console.log(socket.id, ": socket message", message)
      io.in(roomID).emit("message", socket.id + " say: " + message)
    })

    socket.on("create-room", async (data: RoomEvent, callBack: (isHost: boolean) => void) => {
      let roomID = data.roomID
      socket.join(roomID)
      // io.in(roomID).emit("message", socket.id + "joined")

      if (rooms.has(roomID)) {

        let room = rooms.get(roomID)!
        let player: Player = {
          id: socket.id, //use socket id first
          name: "player",
          isHost: false,
          isJoined: true,
          isReady: false,
        }
        room.players.set(socket.id, player)

        console.log("joins ", rooms)
        callBack(false)
        return
      }

      let player: Player = {
        id: socket.id, //use socket id first
        name: "host",
        isHost: true,
        isReady: false,
        isJoined: false
      }

      let room = new GuessSongGameRoom(roomID)
      room.players.set(socket.id, player)
      rooms.set(roomID, room)
      io.in(socket.id).emit("message", "You are the host")
      callBack(true)
      console.log("create ", rooms)
    })

    socket.on("join-game", async (data: RoomEvent, callBack: () => void) => {

      let roomID = data.roomID
      let room = rooms.get(roomID)

      let player = room?.players.get(data.playerID ?? "")
      console.log("join", player)
      if (room && player) {
        player.isJoined = true
      }
      io.in(roomID).emit("message", socket.id + ": join game")
      callBack()
    })

    socket.on("load-music", async (data: RoomEvent, gameOption: GuessSongGameOption, currentSongID: string) => {
      console.log("load music", data, gameOption, currentSongID)
      let roomID = data.roomID
      let gameOptions = gameOption
      let room = rooms.get(roomID)
      if (room) {
        room.currentSongID = currentSongID
        io.in(roomID).emit("message", "start get music")
        io.in(roomID).emit("buffer-music", gameOptions)
      }
    })

    socket.on("start-music", async (data: RoomEvent) => {
      let roomID = data.roomID

      io.in(roomID).emit("message", "start play music")
      io.in(roomID).emit("play-music")
    })

    socket.on("finish-buffer-music", async (data: RoomEvent) => {
      let roomID = data.roomID
      let room = rooms.get(roomID)
    
      let player = room?.players.get(data.playerID ?? "")
      if (room && player) {
        player.isReady = true
        if (room.checkAllPlayersIsReady()) {
          console.log("------------------------- all finish-buffer-music")
          io.in(roomID).emit("play-music")
          room.reset()
        }
      }
      console.log("finish-buffer-music", room)
    })

    socket.on("replay-music", async (data: RoomEvent) => {
      let roomID = data.roomID
      io.in(roomID).emit("message", "replay-music")
      io.in(roomID).emit("replay-music")
    })
  })

  res.socket.server.io = io
  res.status(201).json({ success: true, message: "Socket is started", socket: `:${PORT + 1}` })
}

let rooms: Map<string, GuessSongGameRoom> = new Map()

class GuessSongGameRoom {
  roomID: string
  players: Map<string, Player>
  currentSongID?: string

  constructor(roomID: string) {
    this.roomID = roomID
    this.players = new Map()
  }

  joinedPlayer = () => {
    let map = new Map<string, Player>()
    this.players.forEach((value, key) => {
      map.set(key, value)
    })
    return map
  }

  reset = () => {
    this.players.forEach((k) => {
        k.isReady = false
    })
  }

  removePlayer = (id: string) => {
    this.players.delete(id)
    if (this.players.size === 0) {
      rooms.delete(this.roomID)
    }
  }

  checkAllPlayersIsReady = () => {
    let isAllReady = true
    if (this.players.size == 1) {
      return false
    }
    this.players.forEach((values, keys) => {
      if (!values.isReady)
        isAllReady = false
    });
    return isAllReady
  }
}

interface Player {
  name: string,
  id: string,
  isReady: boolean,
  isHost: boolean,
  isJoined: boolean,
}

export interface RoomEvent {
  roomID: string,
  playerID?: string,
}

export interface GuessSongGameOption {
  youtubeID: string,
  startTime: number,
  duration: number,
}