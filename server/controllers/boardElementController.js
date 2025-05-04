import Board from "../models/Board.js";
import { v4 as uuidv4 } from "uuid";

// Add a new element to the board
export const addElement = async (req, res) => {
  try {
    const { boardId } = req.params;
    const { type, data } = req.body;
    
    const board = await Board.findOne({
      _id: boardId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found or you don't have permission" });
    }

    // Create a new element with a unique ID
    const newElement = {
      id: uuidv4(),
      type,
      data,
      createdBy: req.user._id,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to board content
    if (!board.content.elements) {
      board.content.elements = [];
    }
    
    board.content.elements.push(newElement);
    board.content.version += 1;
    
    // Save the board with version history
    const historyEntry = {
      content: JSON.parse(JSON.stringify(board.content)),
      timestamp: new Date(),
      user: req.user._id
    };
    
    board.versionHistory.push(historyEntry);
    await board.save();
    
    res.status(201).json(newElement);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update an element on the board
export const updateElement = async (req, res) => {
  try {
    const { boardId, elementId } = req.params;
    const updates = req.body;
    
    const board = await Board.findOne({
      _id: boardId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found or you don't have permission" });
    }

    // Find the element to update
    const elementIndex = board.content.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) {
      return res.status(404).json({ message: "Element not found" });
    }

    // Update element
    Object.keys(updates).forEach(key => {
      if (key !== 'id' && key !== 'createdBy' && key !== 'createdAt') {
        board.content.elements[elementIndex][key] = updates[key];
      }
    });
    
    board.content.elements[elementIndex].updatedAt = new Date();
    board.content.version += 1;
    
    // Save the board with version history
    const historyEntry = {
      content: JSON.parse(JSON.stringify(board.content)),
      timestamp: new Date(),
      user: req.user._id
    };
    
    board.versionHistory.push(historyEntry);
    await board.save();
    
    res.json(board.content.elements[elementIndex]);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete an element from the board
export const deleteElement = async (req, res) => {
  try {
    const { boardId, elementId } = req.params;
    
    const board = await Board.findOne({
      _id: boardId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found or you don't have permission" });
    }

    // Find and remove the element
    const elementIndex = board.content.elements.findIndex(el => el.id === elementId);
    if (elementIndex === -1) {
      return res.status(404).json({ message: "Element not found" });
    }

    board.content.elements.splice(elementIndex, 1);
    board.content.version += 1;
    
    // Save the board with version history
    const historyEntry = {
      content: JSON.parse(JSON.stringify(board.content)),
      timestamp: new Date(),
      user: req.user._id
    };
    
    board.versionHistory.push(historyEntry);
    await board.save();
    
    res.json({ message: "Element deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Get all elements from a board
export const getElements = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    const board = await Board.findOne({
      _id: boardId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found or you don't have permission" });
    }

    res.json(board.content.elements || []);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 