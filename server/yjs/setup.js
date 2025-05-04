import * as Y from 'yjs';

export const setupYjs = (io) => {
  // Create a Y.Doc instance for each board
  const docs = new Map();
  
  // Keep track of connected users by boardId
  const boardUsers = new Map();

  io.on('connection', (socket) => {
    socket.on('join-board', async (boardId) => {
      try {
        // Create a new Y.Doc if it doesn't exist for this board
        if (!docs.has(boardId)) {
          const doc = new Y.Doc();
          docs.set(boardId, doc);
          boardUsers.set(boardId, new Set());
        }

        const doc = docs.get(boardId);
        const users = boardUsers.get(boardId);
        
        // Add user to board
        users.add(socket.id);
        
        // Handle Yjs updates from this client
        socket.on('yjs-update', (data) => {
          const { update } = data;
          // Apply the update to the shared document
          Y.applyUpdate(doc, new Uint8Array(update));
          
          // Broadcast to all other clients in this board
          socket.to(boardId).emit('yjs-update', {
            update,
            userId: socket.id,
            timestamp: new Date()
          });
        });

        // Send the current document state to the client
        const initialState = Y.encodeStateAsUpdate(doc);
        socket.emit('yjs-sync', {
          update: Array.from(initialState),
          userId: socket.id,
          timestamp: new Date()
        });
        
        // Notify others about the new user
        socket.to(boardId).emit('user-joined', {
          userId: socket.id,
          timestamp: new Date(),
          activeUsers: Array.from(users)
        });

        // Handle awareness updates (cursor positions, user info, etc.)
        socket.on('awareness-update', (data) => {
          socket.to(boardId).emit('awareness-update', {
            ...data,
            userId: socket.id,
            timestamp: new Date()
          });
        });

        // Handle disconnection from this board
        const handleDisconnectFromBoard = () => {
          if (users.has(socket.id)) {
            users.delete(socket.id);
            socket.to(boardId).emit('user-left', {
              userId: socket.id,
              timestamp: new Date(),
              activeUsers: Array.from(users)
            });
            
            // Clean up if no users are left
            if (users.size === 0) {
              docs.delete(boardId);
              boardUsers.delete(boardId);
            }
          }
        };

        // Clean up on disconnect or when leaving the board
        socket.on('leave-board', handleDisconnectFromBoard);
        socket.on('disconnect', handleDisconnectFromBoard);

      } catch (error) {
        console.error('Error setting up Yjs:', error);
        socket.emit('error', { message: 'Error setting up collaboration' });
      }
    });
  });
}; 