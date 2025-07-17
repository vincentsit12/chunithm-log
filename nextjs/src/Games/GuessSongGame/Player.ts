
export class Player {
    name: string;
    id: string;
    isReady: boolean;
    isHost: boolean;
    isJoined: boolean;
    score: number;
    isAnswered: boolean;
    isSurrendered: boolean;
    isRequestedLonger: boolean;
    isRequestedAnotherSection: boolean;

    constructor(name: string, id: string, isHost: boolean = false) {
        this.name = name;
        this.id = id;
        this.isHost = isHost;
        this.isReady = false;
        this.isJoined = false;
        this.score = 0;
        this.isAnswered = false;
        this.isSurrendered = false;
        this.isRequestedLonger = false;
        this.isRequestedAnotherSection = false;
    }

    getPlayerName = () => {
        return this.name + (this.isHost ? " (Host)" : "")
    }
}