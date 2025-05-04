import Board from "../models/Board.js";

export const setupSocketHandlers = (io) => {
  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a board room
    socket.on('join-board', async (boardId) => {
      try {
        const board = await Board.findById(boardId);
        if (!board) {
          socket.emit('error', { message: 'Board not found' });
          return;
        }

        socket.join(boardId);
        socket.emit('board-joined', { boardId });
        
        // Notify others in the room
        socket.to(boardId).emit('user-joined', {
          userId: socket.id,
          timestamp: new Date()
        });
      } catch (error) {
        socket.emit('error', { message: 'Error joining board' });
      }
    });

    // Leave a board room
    socket.on('leave-board', (boardId) => {
      socket.leave(boardId);
      socket.to(boardId).emit('user-left', {
        userId: socket.id,
        timestamp: new Date()
      });
    });

    // Handle drawing updates
    socket.on('drawing-update', (data) => {
      const { boardId, element } = data;
      socket.to(boardId).emit('drawing-update', {
        userId: socket.id,
        element,
        timestamp: new Date()
      });
    });

    // Handle cursor movement
    socket.on('cursor-move', (data) => {
      const { boardId, position } = data;
      socket.to(boardId).emit('cursor-move', {
        userId: socket.id,
        position,
        timestamp: new Date()
      });
    });

    // Handle chat messages
    socket.on('chat-message', (data) => {
      const { boardId, message } = data;
      socket.to(boardId).emit('chat-message', {
        userId: socket.id,
        message,
        timestamp: new Date()
      });
    });

    // Handle board element updates
    socket.on('element-update', (data) => {
      const { boardId, elementId, updates } = data;
      socket.to(boardId).emit('element-update', {
        userId: socket.id,
        elementId,
        updates,
        timestamp: new Date()
      });
    });

    // Handle board element deletion
    socket.on('element-delete', (data) => {
      const { boardId, elementId } = data;
      socket.to(boardId).emit('element-delete', {
        userId: socket.id,
        elementId,
        timestamp: new Date()
      });
    });

    // Handle board settings updates
    socket.on('board-settings-update', (data) => {
      const { boardId, settings } = data;
      socket.to(boardId).emit('board-settings-update', {
        userId: socket.id,
        settings,
        timestamp: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}; 