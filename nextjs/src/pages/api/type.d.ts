import type { Server as HTTPServer } from "http"
import type { Socket as NetSocket } from "net"
import { NextApiResponse } from "next"
import type { Server as IOServer } from "socket.io"
import { GuessSongGameRoom } from "./socket"

interface SocketServer extends HTTPServer {
    io?: IOServer | undefined
}

interface SocketWithIO extends NetSocket {
    server: SocketServer
}


interface NextApiResponseWithSocket<T> extends NextApiResponse<T> {
    socket: SocketWithIO
}