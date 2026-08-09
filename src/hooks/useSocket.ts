import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let globalSocket: Socket | null = null;

export function useSocket(room?: string): Socket | null {
  const [socket, setSocket] = useState<Socket | null>(() => globalSocket);

  useEffect(() => {
    if (!globalSocket) {
      globalSocket = io({
        transports: ['websocket', 'polling'],
        autoConnect: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000
      });
    }

    setSocket(globalSocket);

    if (room && globalSocket) {
      globalSocket.emit('join_room', room);
    }

    return () => {
      if (room && globalSocket) {
        globalSocket.emit('leave_room', room);
      }
    };
  }, [room]);

  return socket;
}
