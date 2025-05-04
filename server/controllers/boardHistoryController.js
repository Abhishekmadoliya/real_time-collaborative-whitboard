import Board from "../models/Board.js";

// Get version history for a board
export const getVersionHistory = async (req, res) => {
  try {
    const { boardId } = req.params;
    
    const board = await Board.findOne({
      _id: boardId,
      $or: [
        { owner: req.user._id },
        { 'collaborators.user': req.user._id }
      ]
    }).populate('versionHistory.user', 'username profile.displayName');

    if (!board) {
      return res.status(404).json({ message: "Board not found or you don't have permission" });
    }

    // Return simplified history data without the full content
    const history = board.versionHistory.map(version => ({
      id: version._id,
      timestamp: version.timestamp,
      user: version.user,
      version: version.content.version
    }));

    res.json(history);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a specific version of a board
export const getVersion = async (req, res) => {
  try {
    const { boardId, versionId } = req.params;
    
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

    const version = board.versionHistory.id(versionId);
    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    res.json(version.content);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Revert to a specific version
export const revertToVersion = async (req, res) => {
  try {
    const { boardId, versionId } = req.params;
    
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

    const version = board.versionHistory.id(versionId);
    if (!version) {
      return res.status(404).json({ message: "Version not found" });
    }

    // Create a new version with the reverted content
    const revertedContent = JSON.parse(JSON.stringify(version.content));
    revertedContent.version += 1; // Increment version number
    
    board.content = revertedContent;
    
    // Add the revert action to version history
    const historyEntry = {
      content: JSON.parse(JSON.stringify(board.content)),
      timestamp: new Date(),
      user: req.user._id
    };
    
    board.versionHistory.push(historyEntry);
    await board.save();
    
    res.json({ 
      message: "Board reverted successfully", 
      content: board.content 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 