import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket = null;

export const initializeSocket = (token) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io(SOCKET_URL, {
    auth: {
      token
    },
    transports: ['websocket'],
    autoConnect: true
  });

  socket.on('connect', () => {
    console.log('Connected to socket server');
  });

  socket.on('connect_error', (error) => {
    console.error('Socket connection error:', error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    const token = localStorage.getItem('token');
    if (token) {
      return initializeSocket(token);
    }
    throw new Error('Socket not initialized and no token available');
  }
  return socket;
};

export const joinBoard = (boardId) => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('join-board', boardId);
};

export const leaveBoard = (boardId) => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('leave-board', boardId);
};

export const emitDrawingUpdate = (boardId, element) => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('drawing-update', { boardId, element });
};

export const emitCursorMove = (boardId, position) => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('cursor-move', { boardId, position });
};

export const emitElementUpdate = (boardId, elementId, updates) => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('element-update', { boardId, elementId, updates });
};

export const emitElementDelete = (boardId, elementId) => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('element-delete', { boardId, elementId });
};

export const emitYjsUpdate = (boardId, update) => {
  if (!socket) {
    throw new Error('Socket not initialized');
  }
  socket.emit('yjs-update', { boardId, update });
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}; 