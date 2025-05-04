import express from "express";
import Board from "../models/Board.js";
import { authenticateUser } from "../middleware/auth.js";
import { 
  addElement, 
  updateElement, 
  deleteElement, 
  getElements 
} from "../controllers/boardElementController.js";
import {
  getVersionHistory,
  getVersion,
  revertToVersion
} from "../controllers/boardHistoryController.js";

const router = express.Router();

// Create a new board
router.post("/", authenticateUser, async (req, res) => {
  try {
    const board = new Board({
      name: req.body.name,
      description: req.body.description,
      owner: req.user._id,
      collaborators: [{
        user: req.user._id,
        role: 'admin'
      }]
    });

    await board.save();
    res.status(201).json(board);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all boards for a user
router.get("/", authenticateUser, async (req, res) => {
  try {
    const boards = await Board.find({
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('owner', 'username profile.displayName');
    if (boards.length == 0) {
        res.json({message:"Oops! No Boards are available curruntly",boards_available:boards.length});
        return
    }
    
    res.json(boards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a specific board
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('owner', 'username profile.displayName')
      .populate('collaborators.user', 'username profile.displayName');

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    res.json(board);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update board settings
router.patch("/:id/settings", authenticateUser, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': { $in: ['admin', 'editor'] } }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    board.settings = { ...board.settings, ...req.body };
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Add collaborator to board
router.post("/:id/collaborators", authenticateUser, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': 'admin' }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    const { userId, role } = req.body;
    board.collaborators.push({ user: userId, role });
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Remove collaborator from board
router.delete("/:id/collaborators/:userId", authenticateUser, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id, 'collaborators.role': 'admin' }
      ]
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    board.collaborators = board.collaborators.filter(
      collab => collab.user.toString() !== req.params.userId
    );
    await board.save();
    res.json(board);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete board
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const board = await Board.findOne({
      _id: req.params.id,
      owner: req.user._id
    });

    if (!board) {
      return res.status(404).json({ message: "Board not found" });
    }

    await Board.findByIdAndDelete(req.params.id);
    res.json({ message: "Board deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Board elements routes
router.get("/:boardId/elements", authenticateUser, getElements);
router.post("/:boardId/elements", authenticateUser, addElement);
router.patch("/:boardId/elements/:elementId", authenticateUser, updateElement);
router.delete("/:boardId/elements/:elementId", authenticateUser, deleteElement);

// Board history routes
router.get("/:boardId/history", authenticateUser, getVersionHistory);
router.get("/:boardId/history/:versionId", authenticateUser, getVersion);
router.post("/:boardId/history/:versionId/revert", authenticateUser, revertToVersion);

export default router; 