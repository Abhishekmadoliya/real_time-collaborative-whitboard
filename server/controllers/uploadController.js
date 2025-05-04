import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

// Handle file upload
export const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Generate a unique filename to prevent collisions
    const fileExtension = path.extname(req.file.originalname);
    const uniqueFilename = `${uuidv4()}${fileExtension}`;
    
    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    
    // Save the file
    const filePath = path.join(uploadsDir, uniqueFilename);
    fs.writeFileSync(filePath, req.file.buffer);
    
    // Return the file URL
    const fileUrl = `/uploads/${uniqueFilename}`;
    
    res.status(201).json({
      url: fileUrl,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a list of uploaded files
export const getFiles = async (req, res) => {
  try {
    const uploadsDir = path.join(process.cwd(), 'uploads');
    
    // Create the directory if it doesn't exist
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      return res.json([]);
    }
    
    // Read directory contents
    const files = fs.readdirSync(uploadsDir);
    
    // Get file details
    const fileDetails = files.map(file => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      
      return {
        name: file,
        url: `/uploads/${file}`,
        size: stats.size,
        createdAt: stats.birthtime
      };
    });
    
    res.json(fileDetails);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete a file
export const deleteFile = async (req, res) => {
  try {
    const { filename } = req.params;
    
    // Prevent path traversal attacks
    if (filename.includes('/') || filename.includes('\\')) {
      return res.status(400).json({ message: 'Invalid filename' });
    }
    
    const filePath = path.join(process.cwd(), 'uploads', filename);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }
    
    // Delete the file
    fs.unlinkSync(filePath);
    
    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}; 