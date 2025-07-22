import GuessSongGameRoom from "Games/GuessSongGame/Room";

class Shared {
  rooms: Map<string, GuessSongGameRoom>

  constructor() {
    this.rooms = new Map()
  }
}

let shared: Shared;

if (process.env.NODE_ENV === "production") {
  shared = new Shared();
} else {
  if (!global.sharedInstance) {
    global.sharedInstance = new Shared();
  }
  shared = global.sharedInstance;
}

export default shared;

declare global {
  var sharedInstance: Shared
}