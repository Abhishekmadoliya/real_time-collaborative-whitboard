import mongoose from "mongoose";

const boardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    }
  }],
  content: {
    type: mongoose.Schema.Types.Mixed,
    default: {
      elements: [],
      version: 1
    }
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  settings: {
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    gridSize: {
      type: Number,
      default: 20
    },
    showGrid: {
      type: Boolean,
      default: true
    }
  },
  versionHistory: [{
    content: mongoose.Schema.Types.Mixed,
    timestamp: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
}, {
  timestamps: true
});

const Board = mongoose.model('Board', boardSchema);

export default Board; 