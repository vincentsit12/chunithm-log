// For testing new nextjs server with socket.io

import { MessageDetails } from './src/types';
import GuessSongGameRoom from './src/Games/GuessSongGame/Room';
import shared from './src/pages/api/shared';
import { createServer } from "node:http";
import next from "next";
import { Server } from "socket.io"
import Fuse from 'fuse.js'
import _ from "lodash"
import { GuessGameSong, GuessSongGameOption, GuessSongGameType, RoomEvent } from './src/Games/GuessSongGame/types';
import { Player } from './src/Games/GuessSongGame/Player';


const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handler = app.getRequestHandler();

app.prepare().then(() => {
  const httpServer = createServer(handler);

  const io = new Server(httpServer)

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
        let player: Player = new Player(data.playerName ?? "Guest - " + socket.id.substring(0, 5), socket.id, false)
        room.players.set(socket.id, player)

        console.log("joins ", room.players)
        callBack(false)
        return
      }

      let player: Player = new Player(data.playerName ?? "Host - " + socket.id.substring(0, 5), socket.id, true)

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
        io.in(roomID).emit("message", (player.isHost ? "Host" : player.name) + " joined game")
        io.in(socket.id).emit('change-song-list', room.currentSongList)
      }
    })

    socket.on("load-music", async (data: RoomEvent, gameOption: GuessSongGameOption, currentSongName: string, shouldStartNewRound: boolean) => {
      console.log("load music", data, gameOption, currentSongName,shouldStartNewRound)
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
        io.in(roomID).emit("request-replay", player.name)
        io.in(roomID).emit("message", `${player.name} requested replay music`)
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

  httpServer
    .once("error", (err) => {
      console.error(err);
      process.exit(1);
    })
    .listen(port, () => {
      console.log(`> Ready on http://${hostname}:${port}`);
    });
});