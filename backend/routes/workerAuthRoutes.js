const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const WorkerUser = require('../WorkerUser');
const Worker = require('../Worker');


const JWT_SECRET = 'your_jwt_secret';

// Worker login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    

    const worker = await WorkerUser.findOne({ email });
    
    if (!worker) {
      return res.status(401).json({ message: 'Email sau parolă incorectă' });
    }
    
  
    const isMatch = await worker.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Email sau parolă incorectă' });
    }
    

    const token = jwt.sign(
      { id: worker._id, role: worker.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      token,
      worker: {
        id: worker._id,
        name: worker.name,
        surname: worker.surname,
        email: worker.email,
        role: worker.role,
        salonId: worker.salonId
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/me', async (req, res) => {
  try {

    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    

    const decoded = jwt.verify(token, JWT_SECRET);
    

    const worker = await WorkerUser.findById(decoded.id).select('-password');
    
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json(worker);
  } catch (error) {
    console.error('Get worker error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/update-profile', async (req, res) => {
  try {
 
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    

    const decoded = jwt.verify(token, JWT_SECRET);
    
   
    const { name, surname, phoneNumber, bio, experience, services, availability } = req.body;
    
    const updatedFields = {};
    
    if (name) updatedFields.name = name;
    if (surname) updatedFields.surname = surname;
    if (phoneNumber) updatedFields.phoneNumber = phoneNumber;
    if (bio !== undefined) updatedFields.bio = bio;
    if (experience !== undefined) updatedFields.experience = experience;
    if (services) updatedFields.services = services;
    if (availability) updatedFields.availability = availability;
    
   
    const updatedWorkerUser = await WorkerUser.findByIdAndUpdate(
      decoded.id,
      { $set: updatedFields },
      { new: true }
    ).select('-password');
    
    if (!updatedWorkerUser) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
 
    await Worker.findOneAndUpdate(
      { email: updatedWorkerUser.email },
      { $set: updatedFields }
    );
    
    res.json(updatedWorkerUser);
  } catch (error) {
    console.error('Update worker error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/change-password', async (req, res) => {
  try {
   
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
  
    const decoded = jwt.verify(token, JWT_SECRET);
    
    const { currentPassword, newPassword } = req.body;
    
  
    const worker = await WorkerUser.findById(decoded.id);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
  
    const isMatch = await worker.comparePassword(currentPassword);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'Parola curentă este incorectă' });
    }
    
  
    worker.password = newPassword;
    await worker.save();
    
    res.json({ message: 'Parola a fost actualizată cu succes' });
  } catch (error) {
    console.error('Change password error:', error);
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 