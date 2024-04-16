import type { NextApiRequest, NextApiResponse } from "next"
import { Server } from "socket.io"
import { NextApiResponseWithSocket } from "./type"
import shared from "./shared"
import Fuse from 'fuse.js'
import Songs, { MaimaiSongs } from "db/model/songs"
import { GuessGameSong, MessageDetails } from "types"
import _ from "lodash"


const PORT = 3000
export const config = {
  api: {
    bodyParser: false,
  },
}

export default function SocketHandler(_req: NextApiRequest, res: NextApiResponseWithSocket<any>) {
  if (res.socket.server.io) {
    console.log("Socket is already running")
    res.status(200).json({ success: true, message: "Socket is already running", socket: `:${PORT + 1}` })
    return
  }

  const io = new Server(res.socket.server, {
    addTrailingSlash: false
  })

  io.on("connection", socket => {
    console.log(socket.id, ": socket connect")

    socket.on("disconnecting", async () => {
      console.log(socket.id, ": socket disconnect")

      let x = io.of('/').adapter.sids.get(socket.id)
      x?.forEach((k) => {
        if (shared.rooms.has(k)) {
          let room = shared.rooms.get(k)
          let player = room?.players.get(socket.id)
          if (room && player) {
            room.removePlayer(socket.id)
            if (player.isHost) {
              // todo
              shared.rooms.delete(k)
              io.in(room.roomID).emit("delete-room")
            } else if (player.isJoined) {
              io.in(room.roomID).emit("update-room-info", room.getRoomInfo(socket.id))
              io.in(room.roomID).emit("message", player.name + " leaved room")
            }
            console.log("delete ", room.players)
          }
        }
      })
    })

    socket.on("message", async (data: RoomEvent, message) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(socket.id)
      if (player) {
        io.in(roomID).emit("message", player.name + " say: " + message)
      }
    })

    socket.on("create-room", async (data: RoomEvent, callBack: (isHost: boolean) => void) => {
      let roomID = data.roomID
      socket.join(roomID)
      // io.in(roomID).emit("message", socket.id + "joined")

      if (shared.rooms.has(roomID)) {

        let room = shared.rooms.get(roomID)!
        let player: Player = {
          id: socket.id, //use socket id first
          name: data.playerName ?? "Guest - " + socket.id,
          isHost: false,
          isJoined: true,
          isReady: false,
          score: 0,
          isSurrendered: false
        }
        room.players.set(socket.id, player)

        console.log("joins ", room.players)
        callBack(false)
        return
      }

      let player: Player = {
        id: socket.id, //use socket id first
        name: data.playerName ?? "Host - " + socket.id,
        isHost: true,
        isReady: false,
        isJoined: false,
        score: 0,
        isSurrendered: false
      }

      let room = new GuessSongGameRoom(roomID)
      room.players.set(socket.id, player)
      shared.rooms.set(roomID, room)
      io.in(socket.id).emit("message", "You are the host")
      callBack(true)
      console.log("create ", room.players)
    })

    socket.on("join-game", async (data: RoomEvent) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)

      let player = room?.players.get(data.playerID)
      if (room && player) {
        player.isJoined = true
        io.in(roomID).emit("update-room-info", room.getRoomInfo(socket.id))
        io.in(roomID).emit("message", player.name + " joined game")
        io.in(socket.id).emit('change-song-list', room.currentSongList)
      }
    })

    socket.on("load-music", async (data: RoomEvent, gameOption: GuessSongGameOption, currentSongName: string) => {
      console.log("load music", data, gameOption, currentSongName)
      let roomID = data.roomID
      let gameOptions = { ...gameOption }
      let room = shared.rooms.get(roomID)
      if (room) {
        const shoudStartNewRound = room.currentSongName == undefined
        room.currentSongName = currentSongName
        let details: MessageDetails = { withNotification: true, type: 'info' }
        io.in(roomID).emit("message", "Music will start to play", details)
        if (!gameOptions.isCustom) {
          console.log(gameOptions, room.currentSongName)
          if (shoudStartNewRound) {
            room.currentRound += 1
            io.in(roomID).emit("update-room-info", room.getRoomInfo(socket.id))
            gameOptions.answerRaceChoices = room.generateAnswerRaceChoices(gameOption.answerRaceChoicesNumber)
          } else {
            gameOptions.answerRaceChoices = room.currentChoices
          }
        }

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
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)

      if (room && player) {
        player.isReady = true
        if (room.checkAllPlayersIsReady()) {
          console.log("------------------------- all finish-buffer-music")
          io.in(roomID).emit("play-music")
          room.resetReadyState()
        }
      }
      console.log("finish-buffer-music", room?.players)
    })

    socket.on("replay-music", async (data: RoomEvent) => {
      let roomID = data.roomID
      io.in(roomID).emit("message", "Replay music")
      io.in(roomID).emit("replay-music")
    })

    socket.on("show-answer", (data: RoomEvent) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      if (room) {
        if (!room.currentSongName) {
          let details: MessageDetails = { withNotification: true, type: 'error' }
          io.in(socket.id).emit("message", `Please start the game first!`, details)
        } else {
          io.in(roomID).emit("message", `The answer is ${room.currentSongName}`)
          room.endThisRound()
        }
      }
    })

    socket.on("send-answer", (data: RoomEvent, answer: string) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)
      if (room && player) {
        io.in(roomID).emit("message", player.name + " answer: " + answer)

        if (room.currentSongName && answer) {
          let fuse = new Fuse([room.currentSongName], { includeScore: true })
          let answerMatchingResult = fuse.search(answer)
          if (answer == room.currentSongName || (answerMatchingResult.length > 0 && answerMatchingResult[0].score && answerMatchingResult[0].score <= 0.3)) {
            player.score += 1
            let details: MessageDetails = { withNotification: true, type: 'success' }
            io.in(roomID).emit("message", `${player.name} is correct`, details)
            io.in(roomID).emit("message", `${player.name} score : ${player.score}`)
            room.endThisRound()
          }
        }
      }
    })

    socket.on("get-player-count", (data: RoomEvent, callBack: (playerCount: number) => void) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      if (room) {
        callBack(room.joinedPlayer().size)
      } else {
        callBack(0)
      }

    })
    socket.on("change-game-type", (data: RoomEvent, gameType: string) => {
      let roomID = data.roomID
      let details: MessageDetails = { withNotification: true, onlyPlayer: true, type: 'info' }
      io.in(roomID).emit("message", `Host changed the game type to ${gameType}`, details)
    })

    socket.on("change-song-list", (data: RoomEvent, songList: GuessGameSong[]) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      if (room) {
        room.currentSongList = songList
        io.in(roomID).emit("change-song-list", songList)
      }
    })


    socket.on("request-replay", (data: RoomEvent) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)
      if (room && player) {
        io.in(roomID).emit("request-replay", player.name)
        io.in(roomID).emit("message", `${player.name} request replay music`)
      }
    })

    socket.on("surrender", (data: RoomEvent) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)
      if (room && player) {
        let details: MessageDetails = { withNotification: true, type: 'error' }
        if (!room.currentSongName) {
          io.in(socket.id).emit("message", `Please wait the next round start!`, details)
          return
        } if (player.isSurrendered) {
          io.in(socket.id).emit("message", `諦めるのは最後までいっぱい頑張ってからにして下さい！`, details)
          return
        } else {
          player.isSurrendered = true
          const [surrenderedCount, totalPlayerCount] = room.getSurrenderedCount()
          io.in(roomID).emit("message", `${surrenderedCount} of ${totalPlayerCount} surrendered`)
          if (surrenderedCount == totalPlayerCount) {
            io.in(roomID).emit("message", `The answer is ${room.currentSongName}`)
            room.endThisRound()
          }
          io.in(roomID).emit("update-room-info", room.getRoomInfo(socket.id))
        }
      }
    })
  })

  res.socket.server.io = io
  res.status(201).json({ success: true, message: "Socket is started", socket: `:${PORT + 1}` })
}


export class GuessSongGameRoom {
  roomID: string
  players: Map<string, Player>
  currentSongName?: string
  currentSongList: GuessGameSong[]
  currentChoices: string[]
  currentRound: number

  constructor(roomID: string) {
    this.roomID = roomID
    this.players = new Map()
    this.currentSongList = []
    this.currentChoices = []
    this.currentRound = 0
  }

  // Return player that is host or is joined to the game
  // *host is always inside the game, but can choose to not join to the game
  joinedPlayer = (withHost: boolean = true) => {
    let map = new Map<string, Player>()
    this.players.forEach((value, key) => {
      if (value.isJoined || (value.isHost && withHost))
        map.set(key, value)
    })
    return map
  }

  resetReadyState = () => {
    this.players.forEach((k) => {
      k.isReady = false
    })
  }

  removePlayer = (id: string) => {
    this.players.delete(id)
    if (this.players.size === 0) {
      shared.rooms.delete(this.roomID)
    }
  }

  checkAllPlayersIsReady = () => {
    let isAllReady = true

    this.joinedPlayer().forEach((values, keys) => {
      if (!values.isReady)
        isAllReady = false
    });
    return isAllReady
  }

  endThisRound = () => {
    this.currentSongName = undefined
    this.players.forEach((k) => {
      k.isSurrendered = false
    })
  }


  getSurrenderedCount = () => {
    let joinedPlayer = this.joinedPlayer(false)
    let surrenderedCount = 0

    joinedPlayer.forEach((values, keys) => {
      if (values.isSurrendered)
        surrenderedCount += 1
    });
    return [surrenderedCount, joinedPlayer.size]
  }


  generateAnswerRaceChoices = (number: number) => {
    if (!this.currentSongName || number - 1 < 0) return []
    let songMap = _.map(this.currentSongList, k => k.display_name)
    let choices = _.sampleSize(_.filter(songMap, k => k != this.currentSongName), number - 1)
    choices.splice((choices.length + 1) * Math.random() | 0, 0, this.currentSongName)
    this.currentChoices = choices
    return choices
  }

  getRoomInfo = (id: string) => {
    let joinedPlayer = this.joinedPlayer()
    let self = joinedPlayer.get(id)
    let roomInfo: RoomInfo = {
      roomID: this.roomID,
      noOfRound: this.currentRound,
      players: Array.from(joinedPlayer.values()).map(k => {
        let player = {
          name: k.name,
          isSurrendered: k.isSurrendered,
          score: k.score,
          isHost: k.isHost,
        }
        return player
      }),
      self: self ? {
        name: self?.name,
        isSurrendered: self?.isSurrendered,
        score: self?.score,
        isHost: self?.isHost,
      } : undefined
    }

    return roomInfo

  }
}

interface Player {
  name: string,
  id: string,
  isReady: boolean,
  isHost: boolean,
  isJoined: boolean,
  score: number,
  isSurrendered: boolean
}

export interface RoomEvent {
  roomID: string,
  roomInfo?: RoomInfo
  playerID: string,
  playerName: string,
}

export interface RoomInfo {
  roomID: string,
  noOfRound: number,
  players: RoomPlayer[],
  self?: RoomPlayer
}

export type RoomPlayer = Omit<Player, "id" | "isReady" | "isJoined">

export interface GuessSongGameOption {
  youtubeID: string,
  startTime: string
  duration: string
  isCustom: boolean,
  isFixedStartTime: boolean,
  answerRaceChoices: string[],
  answerRaceChoicesNumber: number,
}