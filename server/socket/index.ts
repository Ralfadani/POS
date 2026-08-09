import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

let io: Server | null = null;

export function initSocket(server: HttpServer): Server {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE']
    }
  });

  io.on('connection', (socket: Socket) => {
    // Client can register their role / room
    socket.on('join_room', (room: string) => {
      socket.join(room);
    });

    socket.on('leave_room', (room: string) => {
      socket.leave(room);
    });

    socket.on('disconnect', () => {
      // Clean disconnect
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function notifyNewOrder(orderData: any) {
  if (!io) return;
  // Broadcast to all POS Tablets and Admin dashboards
  io.emit('new_order', orderData);
  io.to(`session_${orderData.session_id}`).emit('order_created', orderData);
}

export function notifyOrderStatusUpdated(orderData: any) {
  if (!io) return;
  io.emit('order_status_updated', orderData);
  io.to(`session_${orderData.session_id}`).emit('order_status_updated', orderData);
}

export function notifySessionUpdated(sessionData: any) {
  if (!io) return;
  io.emit('session_updated', sessionData);
  io.to(`session_${sessionData.session_id}`).emit('session_updated', sessionData);
}

export function notifyStockChanged(stockData: any) {
  if (!io) return;
  io.emit('stock_changed', stockData);
}

export function notifyTablesUpdated() {
  if (!io) return;
  io.emit('tables_updated');
}
