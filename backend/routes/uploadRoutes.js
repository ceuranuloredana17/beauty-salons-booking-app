const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    let uploadDir = path.join(__dirname, '../uploads');
    
    
    if (req.body && req.body.path) {
      try {
       
        const pathParts = req.body.path.split('/');
      
        pathParts.pop();
        
        if (pathParts.length > 0) {
         
          const subDir = pathParts.join('/');
          uploadDir = path.join(uploadDir, subDir);
        }
      } catch (error) {
        console.error('Error parsing path parameter:', error);
      }
    }
    

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    console.log('Upload directory:', uploadDir);
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
   
    let filename;
    
    if (req.body && req.body.path) {
      try {
      
        const pathParts = req.body.path.split('/');
        const originalFilename = pathParts[pathParts.length - 1];
        
        
        const filenameParts = originalFilename.split('.');
        const ext = filenameParts.pop();
        const name = filenameParts.join('.');
        filename = `${name}-${Date.now()}.${ext}`;
      } catch (error) {
        console.error('Error extracting filename from path:', error);
        filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
      }
    } else {
      filename = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
    }
    
    console.log('Generated filename:', filename);
    cb(null, filename);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, 
  fileFilter: (req, file, cb) => {

    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/)) {
      return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
  }
});


const handleMulterError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ 
        message: 'File too large',
        error: 'The uploaded file exceeds the size limit of 10MB'
      });
    }
    return res.status(400).json({ 
      message: 'Upload error',
      error: err.message
    });
  }
  next(err);
};


router.post('/', upload.single('file'), handleMulterError, async (req, res) => {
  try {
    console.log('Upload request received:', {
      file: req.file ? req.file.filename : 'No file',
      body: req.body
    });
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

   
    const serverUrl = process.env.SERVER_URL || 'http://localhost:8080';
    
   L
    const publicUrl = `${serverUrl}/uploads/${req.file.filename}`;
    
    console.log('File uploaded successfully:', {
      url: publicUrl,
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size
    });
    
    res.json({ 
      message: 'File uploaded successfully',
      url: publicUrl,
      filename: req.file.filename,
      path: req.file.path,
      originalName: req.file.originalname,
      size: req.file.size
    });
  } catch (error) {
    console.error('Error in file upload:', error);
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
});

module.exports = router; 