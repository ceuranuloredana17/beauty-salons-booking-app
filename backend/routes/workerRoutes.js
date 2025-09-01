const express = require('express');
const router = express.Router();
const Worker = require('../Worker');
const WorkerUser = require('../WorkerUser');
const Salon = require('../Salon');


router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;
    
    console.log(`Fetching workers for salon: ${salonId}`);
    

    if (!salonId || salonId === 'undefined') {
      console.error('Invalid salon ID provided:', salonId);
      return res.status(400).json({ message: 'ID de salon invalid' });
    }
    
    
    const workers = await Worker.find({ salonId });
    console.log(`Found ${workers.length} workers in Worker collection`);
    
    
    const enhancedWorkers = await Promise.all(workers.map(async (worker) => {
      
      const workerData = worker.toObject();
      
      try {
       
        const workerUser = await WorkerUser.findOne({ email: worker.email });
        
        if (workerUser) {
          console.log(`Found WorkerUser data for worker: ${worker.name} ${worker.surname}`);
          
   
          if (workerUser.image && !workerData.image) {
            workerData.image = workerUser.image;
          }
          if (workerUser.bio && !workerData.bio) {
            workerData.bio = workerUser.bio;
          }
          if (workerUser.experience && !workerData.experience) {
            workerData.experience = workerUser.experience;
          }
          
    
          if (workerUser.services && workerUser.services.length > 0) {
     
            const serviceMap = {};
            workerData.services.forEach((service, index) => {
              if (typeof service === 'object' && service.name) {
                serviceMap[service.name] = { service, index };
              }
            });
            
      
            workerUser.services.forEach(service => {
              if (typeof service === 'object' && service.name) {
                if (serviceMap[service.name]) {
           
                  workerData.services[serviceMap[service.name].index] = {
                    ...workerData.services[serviceMap[service.name].index],
                    ...service
                  };
                } else {
               
                  workerData.services.push(service);
                }
              }
            });
          }
          
        
          if (workerUser.availability && (!workerData.availability || workerData.availability.length === 0)) {
            workerData.availability = workerUser.availability;
          }
        }
      } catch (err) {
        console.error(`Error merging WorkerUser data for ${worker.email}:`, err);
     
      }
      
      return workerData;
    }));
    
    console.log(`Returning ${enhancedWorkers.length} enhanced worker records`);
    res.json(enhancedWorkers);
  } catch (error) {
    console.error('Error fetching salon workers:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const worker = await Worker.findById(req.params.id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    res.json(worker);
  } catch (error) {
    console.error('Error fetching worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    const worker = await Worker.findOne({ email });
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json(worker);
  } catch (error) {
    console.error('Error fetching worker by email:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/', async (req, res) => {
  try {
    const { name, surname, phoneNumber, email, services, salonId, availability, image, experience, bio } = req.body;
    

    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    

    const newWorker = new Worker({
      name,
      surname,
      phoneNumber,
      email,
      services,
      salonId,
      availability,
      image,
      experience,
      bio
    });
    
    await newWorker.save();
    res.status(201).json(newWorker);
  } catch (error) {
    console.error('Error adding worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updatedWorker = await Worker.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    if (!updatedWorker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json(updatedWorker);
  } catch (error) {
    console.error('Error updating worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, imageUrl } = req.body;
    

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    

    const existingServiceIndex = worker.services.findIndex(s => s.name === name);
    
    if (existingServiceIndex !== -1) {

      worker.services[existingServiceIndex].price = price;
      if (imageUrl) {
        worker.services[existingServiceIndex].imageUrl = imageUrl;
      }
    } else {
      
      worker.services.push({ name, price, imageUrl: imageUrl || '' });
    }
    
    await worker.save();
    
   
    const workerUser = await WorkerUser.findOne({ email: worker.email });
    if (workerUser) {
      if (existingServiceIndex !== -1) {
       
        const userServiceIndex = workerUser.services.findIndex(s => s.name === name);
        if (userServiceIndex !== -1) {
          workerUser.services[userServiceIndex].price = price;
          if (imageUrl) {
            workerUser.services[userServiceIndex].imageUrl = imageUrl;
          }
        } else {
          workerUser.services.push({ name, price, imageUrl: imageUrl || '' });
        }
      } else {
      
        workerUser.services.push({ name, price, imageUrl: imageUrl || '' });
      }
      await workerUser.save();
    }
    
    res.json(worker);
  } catch (error) {
    console.error('Error updating worker service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id/services/:serviceName', async (req, res) => {
  try {
    const { id, serviceName } = req.params;
    

    const worker = await Worker.findById(id);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    

    worker.services = worker.services.filter(s => s.name !== serviceName);
    await worker.save();
    

    const workerUser = await WorkerUser.findOne({ email: worker.email });
    if (workerUser) {
      workerUser.services = workerUser.services.filter(s => s.name !== serviceName);
      await workerUser.save();
    }
    
    res.json({ message: 'Service removed successfully' });
  } catch (error) {
    console.error('Error removing worker service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.delete('/:id', async (req, res) => {
  try {
    const worker = await Worker.findByIdAndDelete(req.params.id);
    
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }
    
    res.json({ message: 'Worker deleted successfully' });
  } catch (error) {
    console.error('Error deleting worker:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 