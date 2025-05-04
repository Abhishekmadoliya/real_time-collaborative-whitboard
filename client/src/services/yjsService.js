import * as Y from 'yjs';
import { emitYjsUpdate } from './socketService';

let ydoc = null;
let boardId = null;

export const initializeYDoc = (bId) => {
  if (ydoc) {
    // Clean up previous document if it exists
    ydoc.destroy();
  }

  boardId = bId;
  ydoc = new Y.Doc();
  return ydoc;
};

export const applyYjsUpdate = (update) => {
  if (!ydoc) {
    throw new Error('YDoc not initialized');
  }

  Y.applyUpdate(ydoc, new Uint8Array(update));
};

export const getYDoc = () => {
  if (!ydoc) {
    throw new Error('YDoc not initialized');
  }
  return ydoc;
};

export const createYMap = (name) => {
  if (!ydoc) {
    throw new Error('YDoc not initialized');
  }
  return ydoc.getMap(name);
};

export const createYArray = (name) => {
  if (!ydoc) {
    throw new Error('YDoc not initialized');
  }
  return ydoc.getArray(name);
};

export const subscribeToYDocUpdates = (callback) => {
  if (!ydoc) {
    throw new Error('YDoc not initialized');
  }

  // Subscribe to document updates
  ydoc.on('update', (update, origin) => {
    // Only emit updates that originated locally
    if (origin !== 'remote') {
      if (boardId) {
        // Convert Uint8Array to Array for socket.io
        emitYjsUpdate(boardId, Array.from(update));
      }
    }
    
    // Call the callback with the update
    if (callback) {
      callback(update, origin);
    }
  });
};

export const getStateAsUpdate = () => {
  if (!ydoc) {
    throw new Error('YDoc not initialized');
  }
  
  return Y.encodeStateAsUpdate(ydoc);
};

export const destroyYDoc = () => {
  if (ydoc) {
    ydoc.destroy();
    ydoc = null;
    boardId = null;
  }
}; 