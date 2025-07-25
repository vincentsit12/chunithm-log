import { GuessGameSong, GuessSongGameOption, GuessSongGameType, RoomEvent, RoomInfo } from 'Games/GuessSongGame/types';
import { NextApiResponseWithSocket } from './apiTypes';
import type { NextApiRequest, NextApiResponse } from "next"
import { Server } from "socket.io"
import shared from "./shared"
import Fuse from 'fuse.js'
import _ from "lodash"
import { MessageDetails } from 'types';
import { Player } from 'Games/GuessSongGame/Player';


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
              io.in(room.roomID).emit("update-room-info", room.getRoomInfo())
              io.in(room.roomID).emit("message", player.getPlayerName() + " leaved room")
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
        io.in(roomID).except(socket.id).emit("message", player.getPlayerName() + " : " + message)
        io.in(socket.id).emit("message", "You : " + message)
      }
    })

    socket.on("create-room", async (data: RoomEvent, callBack: (isHost: boolean) => void) => {
      let roomID = data.roomID
      socket.join(roomID)
      // io.in(roomID).emit("message", socket.id + "joined")

      if (shared.rooms.has(roomID)) {

        let room = shared.rooms.get(roomID)!
        let player = new Player(data.playerName ?? "Guest - " + socket.id.substring(0, 5), socket.id, false)
        room.players.set(socket.id, player)

        console.log("joins ", room.players)
        callBack(false)
        return
      }

      let player = new Player(data.playerName ?? "Host - " + socket.id.substring(0, 5), socket.id, true)

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
        io.in(roomID).emit("update-room-info", room.getRoomInfo())
        io.in(roomID).emit("message", player.getPlayerName() + " joined game")
        io.in(socket.id).emit('change-song-list', room.currentSongList)
      }
    })

    socket.on("load-music", async (data: RoomEvent, gameOption: GuessSongGameOption, currentSongName: string, shouldStartNewRound: boolean) => {
      console.log("load music", data, gameOption, currentSongName, shouldStartNewRound)
      let roomID = data.roomID
      let _gameOption = { ...gameOption }
      let room = shared.rooms.get(roomID)
      if (room) {
        room.currentSongName = currentSongName
        let details: MessageDetails = { withNotification: true, type: 'info' }
        io.in(room.getHosts()).emit("message", "Waiting all players ready...", details)

        if (shouldStartNewRound) {
          room.currentRound += 1
          io.in(roomID).emit("update-room-info", room.getRoomInfo())
          _gameOption.answerRaceChoices = room.generateAnswerRaceChoices(_gameOption.answerRaceChoicesNumber)
        } else {
          _gameOption.answerRaceChoices = room.currentChoices
        }
        room.resetRequestState()
        io.in(roomID).emit("buffer-music", _gameOption)
      }
    })

    socket.on("finish-buffer-music", async (data: RoomEvent) => {
      console.log("finish-buffer-music", data.playerID)
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)

      if (room && player) {
        player.isReady = true
        if (room.checkAllPlayersIsReady()) {
          console.log("------------------------- all finish-buffer-music")
          let details: MessageDetails = { withNotification: true, type: 'info' }
          io.in(roomID).emit("message", "Music will start to play!", details)
          io.in(roomID).emit("play-music")

          room.resetReadyState()

        } else {
          console.log("not all finish-buffer-music", room?.players)
        }
      }
    })

    socket.on("replay-music", async (data: RoomEvent) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      if (room) {
        if (!room.currentSongName) {
          let details: MessageDetails = { withNotification: true, type: 'error' }
          io.in(socket.id).emit("message", `Please start the game first!`, details)
        } else {
          io.in(roomID).emit("message", "Host Replay music")
          io.in(roomID).emit("replay-music")
        }
      }
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

    socket.on("send-answer", (data: RoomEvent, answer: string, onlyOnce: boolean = false) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)
      if (room && player) {
        io.in(roomID).emit("message", player.getPlayerName() + " answered: " + answer)

        if (room.currentSongName && answer) {
          let fuse = new Fuse([room.currentSongName], { includeScore: true })
          let answerMatchingResult = fuse.search(answer)
          if (answer == room.currentSongName || (answerMatchingResult.length > 0 && answerMatchingResult[0].score && answerMatchingResult[0].score <= 0.3)) {
            player.score += 1
            let details: MessageDetails = { withNotification: true, type: 'success' }
            io.in(roomID).emit("message", `${player.getPlayerName()} is correct`, details)
            io.in(roomID).emit("message", `${player.getPlayerName()} score : ${player.score}`)
            room.endThisRound()
          } else {
            player.isAnswered = onlyOnce
            if (room.checkAllPlayersIsAnswered()) {
              io.in(roomID).emit("message", `All players answered wrong, The answer is ${room.currentSongName}`)
              room.endThisRound()
            }
          }
          io.in(roomID).emit("update-room-info", room.getRoomInfo())
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
    socket.on("change-game-type", (data: RoomEvent, gameType: GuessSongGameType, gameTypeName: string) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let details: MessageDetails = { withNotification: true, onlyPlayer: true, type: 'info' }
      if (room) {
        room.gameType = gameType
        io.in(roomID).emit("update-room-info", room.getRoomInfo())
        io.in(roomID).emit("message", `Host changed the game type to ${gameTypeName}`, details)
      }
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
        let details: MessageDetails = { withNotification: true, type: 'error' }
        if (!room.currentSongName) {
          io.in(socket.id).emit("message", `Please wait the next round start!`, details)
          return
        }
        io.in(roomID).emit("request-replay", player.getPlayerName())
        io.in(roomID).emit("message", `${player.getPlayerName()} requested replay music`)
      }
    })

    socket.on("request-longer", (data: RoomEvent) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)
      if (room && player) {
        let details: MessageDetails = { withNotification: true, type: 'error' }
        if (!room.currentSongName) {
          io.in(socket.id).emit("message", `Please wait the next round start!`, details)
          return
        }
        if (!player.isRequestedLonger) {
          player.isRequestedLonger = true
          const [count, totalPlayerCount] = room.getRequestedLongerCount()
          if (totalPlayerCount / 2 <= count) {
            io.in(roomID).emit("request-longer")
            room.resetRequestLongerState()
          } else {
            let details: MessageDetails = { withNotification: true, onlyPlayer: true, type: 'info' }
            io.in(socket.id).emit("message", "Will send the request to host when half of player was requested", details)
          }

          io.in(roomID).emit("update-room-info", room.getRoomInfo())
        }
      }
    })

    socket.on("request-another-section", (data: RoomEvent) => {
      let roomID = data.roomID
      let room = shared.rooms.get(roomID)
      let player = room?.players.get(data.playerID)
      if (room && player) {
        let details: MessageDetails = { withNotification: true, type: 'error' }
        if (!room.currentSongName) {
          io.in(socket.id).emit("message", `Please wait the next round start!`, details)
          return
        }
        if (!player.isRequestedAnotherSection) {
          player.isRequestedAnotherSection = true
          const [count, totalPlayerCount] = room.getRequestedAnotherSectionCount()
          if (totalPlayerCount / 2 <= count) {
            io.in(roomID).emit("request-another-section")
            room.resetRequestedAnotherSectionState()
          } else {
            let details: MessageDetails = { withNotification: true, onlyPlayer: true, type: 'info' }
            io.in(socket.id).emit("message", "Will send the request to the host when more than half of the players have made a request", details)
          }

          io.in(roomID).emit("update-room-info", room.getRoomInfo())
        }
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
        }
        if (player.isSurrendered) {
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
          io.in(roomID).emit("update-room-info", room.getRoomInfo())
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
  gameType: GuessSongGameType

  constructor(roomID: string) {
    this.roomID = roomID
    this.players = new Map()
    this.currentSongList = []
    this.currentChoices = []
    this.currentRound = 0
    this.gameType = GuessSongGameType.chunithm
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

  resetRequestState = () => {
    this.players.forEach((k) => {
      k.isRequestedLonger = false
      k.isRequestedAnotherSection = false
    })
  }

  resetRequestLongerState = () => {
    this.players.forEach((k) => {
      k.isRequestedLonger = false
    })
  }

  resetRequestedAnotherSectionState = () => {
    this.players.forEach((k) => {
      k.isRequestedAnotherSection = false
    })
  }

  removePlayer = (id: string) => {
    this.players.delete(id)
    if (this.players.size === 0) {
      shared.rooms.delete(this.roomID)
    }
  }

  checkAllPlayersIsReady = () => {
    let notReadyCount = 0
    this.joinedPlayer().forEach((values, keys) => {
      if (!values.isReady)
        notReadyCount += 1
    });
    return notReadyCount == 0
  }

  checkAllPlayersIsAnswered = () => {
    let notAnsweredCount = 0

    this.joinedPlayer(false).forEach(element => {
      if (!element.isAnswered && !element.isSurrendered) {
        notAnsweredCount += 1
      }
    });
    return notAnsweredCount == 0
  }

  endThisRound = () => {
    this.currentSongName = undefined
    this.players.forEach((k) => {
      k.isAnswered = false
      k.isSurrendered = false
    })
  }

  getHosts = () => {
    let hosts: string[] = []
    this.players.forEach((values, keys) => {
      if (values.isHost) {
        hosts.push(values.id)
      }
    });
    return hosts
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

  getRequestedLongerCount = () => {
    let joinedPlayer = this.joinedPlayer(false)
    let requestedLongerCount = 0
    joinedPlayer.forEach((values, keys) => {
      if (values.isRequestedLonger || values.isSurrendered)
        requestedLongerCount += 1
    });
    return [requestedLongerCount, joinedPlayer.size]
  }

  getRequestedAnotherSectionCount = () => {
    let joinedPlayer = this.joinedPlayer(false)
    let requestedAnotherSectionCount = 0
    joinedPlayer.forEach((values, keys) => {
      if (values.isRequestedAnotherSection || values.isSurrendered)
        requestedAnotherSectionCount += 1
    });
    return [requestedAnotherSectionCount, joinedPlayer.size]
  }

  generateAnswerRaceChoices = (number: number) => {
    if (!this.currentSongName || number - 1 < 0) return []
    let songMap = _.map(this.currentSongList, k => k.display_name)
    let choices = _.sampleSize(_.filter(songMap, k => k != this.currentSongName), number - 1)
    choices.splice((choices.length + 1) * Math.random() | 0, 0, this.currentSongName)
    this.currentChoices = choices
    return choices
  }

  getRoomInfo = () => {
    let joinedPlayer = this.joinedPlayer()
    console.log("joinedPlayer : ", joinedPlayer)
    let roomInfo: RoomInfo = {
      roomID: this.roomID,
      noOfRound: this.currentRound,
      players: Array.from(joinedPlayer.values()),
      gameType: this.gameType
    }

    return roomInfo

  }
}