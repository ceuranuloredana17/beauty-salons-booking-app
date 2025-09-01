const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');


const storage = multer.diskStorage({
  destination: function (req, file, cb) {

    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });


router.post('/upload', upload.single('file'), (req, res) => {
  try {
    console.log('File upload request received', {
      body: req.body,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null
    });
    
    if (!req.file) {
      console.error('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }


    const { workerId, salonId, serviceName } = req.body;
    console.log('File metadata:', { workerId, salonId, serviceName });
    

    const fileUrl = `/uploads/${req.file.filename}`;
    

    const response = {
      message: 'File uploaded successfully',
      url: `http://localhost:8080${fileUrl}`,
      filename: req.file.filename
    };
    console.log('Upload successful:', response);
    res.status(200).json(response);
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ message: 'Error uploading file', error: error.message });
  }
});


router.get('/uploads/:filename', (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads', filename);
  

  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ message: 'File not found' });
  }
  

  res.sendFile(filePath);
});

module.exports = router; 