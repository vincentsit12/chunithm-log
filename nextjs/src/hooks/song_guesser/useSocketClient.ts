import { useEffect, useState } from "react";
import { Socket, io } from "socket.io-client";

export function useSocketClient() {
  const [state, setState] = useState(false);
  const [socket, setSocket] = useState<Socket>();

  useEffect(() => {
    let socketRef: Socket | undefined;
    let isUnmounted = false;

    fetch("/api/socket").then(() => {
      if (isUnmounted) return;

      socketRef = io();

      socketRef.on("connect", () => {
        console.log("connected", socketRef?.id);
        setState(true);
      });

      socketRef.on("disconnect", () => {
        console.log("Disconnected");
        setState(false);
      });

      socketRef.on("connect_error", async (err: any) => {
        console.log(`connect_error due to ${err.description}`);
      });

      setSocket(socketRef);
    });

    return () => {
      isUnmounted = true;
      socketRef?.disconnect();
    };
  }, []);

  return { socket, state };
}
