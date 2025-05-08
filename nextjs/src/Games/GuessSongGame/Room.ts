import _ from "lodash"
import shared from "../../../src/pages/api/shared"
import { GuessGameSong, GuessSongGameType, Player, RoomInfo } from "./guessSongGameTypes"

class GuessSongGameRoom {
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

export default GuessSongGameRoom