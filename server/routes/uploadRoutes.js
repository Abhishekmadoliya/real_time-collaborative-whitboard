import express from "express";
import multer from "multer";
import { authenticateUser } from "../middleware/auth.js";
import { uploadFile, getFiles, deleteFile } from "../controllers/uploadController.js";

const router = express.Router();

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept images and PDFs
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only images and PDFs are allowed'), false);
    }
  }
});

// Upload a file
router.post("/", authenticateUser, upload.single('file'), uploadFile);

// Get all files
router.get("/", authenticateUser, getFiles);

// Delete a file
router.delete("/:filename", authenticateUser, deleteFile);

// Serve static files from the uploads directory
router.use('/uploads', express.static('uploads'));

export default router; 