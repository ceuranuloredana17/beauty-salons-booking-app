const express = require('express');
const router = express.Router();
const Invitation = require('../Invitation');
const Salon = require('../Salon');
const WorkerUser = require('../WorkerUser');
const Worker = require('../Worker');
const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
  host: 'smtp.ethereal.email',
  port: 587,
  secure: false,
  auth: {
    user: 'ethereal.user@ethereal.email', 
    pass: 'ethereal_pass', 
  },
});

// Generate and send invitation
router.post('/send', async (req, res) => {
  try {
    const { email, salonId, services } = req.body;
    const token = Invitation.generateToken();
    

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    const invitation = new Invitation({
      email,
      salonId,
      salonName: salon.name,
      ownerId: salon.ownerId,
      token,
      services: services || []
    });
    
    await invitation.save();
    

    const invitationUrl = `http://localhost:3000/worker-register/${token}`;
    

    const mailOptions = {
      from: '"Bookly" <no-reply@bookly.com>',
      to: email,
      subject: `Invitație pentru a lucra la ${salon.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #6200ee;">Invitație pentru a lucra la ${salon.name}</h2>
          <p>Ai fost invitat să te alături echipei de la ${salon.name}.</p>
          <p>Pentru a accepta invitația și a-ți crea contul, te rugăm să accesezi link-ul de mai jos:</p>
          <a href="${invitationUrl}" style="display: inline-block; background-color: #6200ee; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 15px 0;">
            Creează-ți contul
          </a>
          <p>Link-ul va expira în 7 zile.</p>
          <p>Dacă nu ai solicitat această invitație, te rugăm să ignori acest email.</p>
          <p>Mulțumim,<br>Echipa Bookly</p>
        </div>
      `
    };
    

    console.log('Invitation URL:', invitationUrl);
    
    res.status(201).json({
      message: 'Invitation sent successfully',
      invitationUrl,
      invitation
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});


router.get('/verify/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    const invitation = await Invitation.findOne({ token, isUsed: false });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }
    

    res.json({
      valid: true,
      invitation: {
        email: invitation.email,
        salonId: invitation.salonId,
        salonName: invitation.salonName,
        services: invitation.services
      }
    });
  } catch (error) {
    console.error('Error verifying invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Register worker using invitation
router.post('/register', async (req, res) => {
  try {
    const { token, name, surname, password, phoneNumber, bio, experience } = req.body;
    

    const invitation = await Invitation.findOne({ token, isUsed: false });
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invalid or expired invitation' });
    }
    
    // Check if user with email already exists
    const existingUser = await WorkerUser.findOne({ email: invitation.email });
    
    if (existingUser) {
      return res.status(400).json({ message: 'Un cont cu acest email există deja' });
    }
    
    // Create new worker user
    const workerUser = new WorkerUser({
      name,
      surname,
      email: invitation.email,
      password,
      phoneNumber,
      salonId: invitation.salonId,
      services: invitation.services,
      bio: bio || '',
      experience: experience || 0,
 
      availability: [
        { dayOfWeek: 'Luni', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Marți', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Miercuri', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Joi', from: '09:00', to: '17:00' },
        { dayOfWeek: 'Vineri', from: '09:00', to: '17:00' }
      ]
    });
    
    await workerUser.save();
    

    invitation.isUsed = true;
    await invitation.save();
    

    const worker = new Worker({
      name: workerUser.name,
      surname: workerUser.surname,
      phoneNumber: workerUser.phoneNumber,
      email: workerUser.email,
      services: workerUser.services,
      salonId: workerUser.salonId,
      availability: workerUser.availability,
      experience: workerUser.experience,
      bio: workerUser.bio
    });
    
    await worker.save();
    
    res.status(201).json({
      message: 'Worker account created successfully',
      workerId: workerUser._id
    });
  } catch (error) {
    console.error('Error registering worker:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message, 
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
    });
  }
});

// Get all invitations for a salon
router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    
    const invitations = await Invitation.find({ 
      salonId, 
      isUsed: false 
    }).sort({ createdAt: -1 });
    
    res.json(invitations);
  } catch (error) {
    console.error('Error fetching salon invitations:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const invitation = await Invitation.findByIdAndDelete(req.params.id);
    
    if (!invitation) {
      return res.status(404).json({ message: 'Invitation not found' });
    }
    
    res.json({ message: 'Invitation deleted successfully' });
  } catch (error) {
    console.error('Error deleting invitation:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 