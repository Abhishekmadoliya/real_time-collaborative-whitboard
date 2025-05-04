import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Get all boards
export const getBoards = async () => {
  try {
    const response = await axios.get(`${API_URL}/boards`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get a specific board
export const getBoard = async (boardId) => {
  try {
    const response = await axios.get(`${API_URL}/boards/${boardId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Create a new board
export const createBoard = async (boardData) => {
  try {
    const response = await axios.post(`${API_URL}/boards`, boardData);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update board settings
export const updateBoardSettings = async (boardId, settings) => {
  try {
    const response = await axios.patch(`${API_URL}/boards/${boardId}/settings`, settings);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add collaborator to board
export const addCollaborator = async (boardId, userId, role) => {
  try {
    const response = await axios.post(`${API_URL}/boards/${boardId}/collaborators`, { userId, role });
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Remove collaborator from board
export const removeCollaborator = async (boardId, userId) => {
  try {
    const response = await axios.delete(`${API_URL}/boards/${boardId}/collaborators/${userId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete board
export const deleteBoard = async (boardId) => {
  try {
    const response = await axios.delete(`${API_URL}/boards/${boardId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Get board elements
export const getBoardElements = async (boardId) => {
  try {
    const response = await axios.get(`${API_URL}/boards/${boardId}/elements`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Add board element
export const addBoardElement = async (boardId, element) => {
  try {
    const response = await axios.post(`${API_URL}/boards/${boardId}/elements`, element);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Update board element
export const updateBoardElement = async (boardId, elementId, updates) => {
  try {
    const response = await axios.patch(`${API_URL}/boards/${boardId}/elements/${elementId}`, updates);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
};

// Delete board element
export const deleteBoardElement = async (boardId, elementId) => {
  try {
    const response = await axios.delete(`${API_URL}/boards/${boardId}/elements/${elementId}`);
    return response.data;
  } catch (error) {
    throw error.response?.data || error;
  }
}; 