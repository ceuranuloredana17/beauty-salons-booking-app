const express = require('express');
const router = express.Router();
const Salon = require('../Salon');
const Business = require('../Business');
const mongoose = require('mongoose');


router.post('/', async (req, res) => {
  const { name, description, address, location, ownerId, services, workingHours } = req.body;

  try {
    const owner = await Business.findOne({ username: ownerId });

    if (!owner) {
      return res.status(404).json({ message: 'Ownerul nu a fost găsit.' });
    }

    const existingSalon = await Salon.findOne({ ownerId: owner._id });

    let formattedServices = services;
    if (services && Array.isArray(services) && services.length > 0 && typeof services[0] === 'string') {
      formattedServices = services.map(name => ({ name, imageUrl: '' }));
    }

    if (existingSalon) {
      existingSalon.name = name;
      existingSalon.description = description;
      existingSalon.address = address;
      existingSalon.location = location;
      existingSalon.services = formattedServices;
      existingSalon.workingHours = workingHours;

      await existingSalon.save();
      return res.status(200).json({ message: 'Salon actualizat cu succes.', salon: existingSalon });
    }

    const newSalon = new Salon({
      name,
      description,
      address,
      location,
      ownerId: owner._id,
      services: formattedServices,
      workingHours
    });

    await newSalon.save();
    res.status(201).json(newSalon);

  } catch (error) {
    console.error('Eroare la crearea/actualizarea salonului:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});


router.get('/owner/:ownerId', async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const owner = await Business.findOne({ username: ownerId })
    const idOfTheOwner = owner._id;
    const salon = await Salon.findOne({ ownerId: idOfTheOwner });

    if (!salon) {
      return res.status(404).json({ message: 'Salonul nu a fost găsit.' });
    }
    res.json(salon);
  } catch (error) {
    console.error('Eroare la obținerea salonului:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});


router.get('/', async (req, res) => {
  const { sector } = req.query;
  try {
    let query = {};
    if (sector) {
      query["address.sector"] = sector;
    }

    const saloane = await Salon.find(query);
    res.json(saloane);
  } catch (error) {
    console.error("Eroare la căutare saloane:", error);
    res.status(500).json({ message: "Eroare server." });
  }
});


router.post('/:id/services', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, imageUrl } = req.body;
    
    console.log('Service addition request:', {
      salonId: id,
      serviceName: name,
      imageUrl: imageUrl
    });
    
 
    if (!name) {
      return res.status(400).json({ message: 'Service name is required' });
    }
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid salon ID format' });
    }
    
    // Find the salon
    const salon = await Salon.findById(id);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    console.log('Found salon:', {
      id: salon._id,
      name: salon.name,
      servicesCount: salon.services ? salon.services.length : 0
    });
    
    // Check if service already exists
    const existingServiceIndex = salon.services.findIndex(s => {
      if (typeof s === 'string') {
        return s === name;
      } else if (s && typeof s === 'object') {
        return s.name === name;
      }
      return false;
    });
    
    console.log('Existing service index:', existingServiceIndex);
    
    if (existingServiceIndex !== -1) {
     
      console.log('Updating existing service');
      if (imageUrl) {
        if (typeof salon.services[existingServiceIndex] === 'string') {
          
          salon.services[existingServiceIndex] = { name: salon.services[existingServiceIndex], imageUrl };
        } else {
          salon.services[existingServiceIndex].imageUrl = imageUrl;
        }
      }
    } else {
     
      console.log('Adding new service');
      salon.services.push({ name, imageUrl: imageUrl || '' });
    }
    
    console.log('Saving salon with updated services');
    await salon.save();
    console.log('Salon saved successfully');
    
    res.json(salon);
  } catch (error) {
    console.error('Error updating salon service:', error);
    
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});


router.delete('/:id/services/:serviceName', async (req, res) => {
  try {
    const { id, serviceName } = req.params;
    
  
    const salon = await Salon.findById(id);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }
    
    salon.services = salon.services.filter(s => s.name !== serviceName);
    await salon.save();
    
    res.json({ message: 'Service removed successfully' });
  } catch (error) {
    console.error('Error removing salon service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get("/search", async (req, res) => {
  try {
    const { service, sector, date, time } = req.query;
    console.log("Search query:", req.query);

    const query = {};

 
    if (sector) {
      query["address.sector"] = sector;
    }


    if (date && time) {
      try {
        const searchDate = new Date(date);
        if (isNaN(searchDate.getTime())) {
          throw new Error("Invalid date format");
        }

        const days = [
          "Duminică",
          "Luni",
          "Marți",
          "Miercuri",
          "Joi",
          "Vineri",
          "Sâmbătă",
        ];
        const dayOfWeek = days[searchDate.getDay()];
        console.log("Searching for day:", dayOfWeek);

        
        query.workingHours = {
          $elemMatch: {
            dayOfWeek: dayOfWeek,
            from: { $lte: time }, 
            to: { $gte: time }  
          }
        };
      } catch (err) {
        console.error("Date parsing error:", err);
        return res.status(400).json({ message: "Format de dată invalid" });
      }
    }

   
    const salons = await Salon.find(query);
    console.log(`Found ${salons.length} salons before service filter`);

   
    let filteredSalons = salons;
    if (service && service !== "" && service !== "Any Service") {
      console.log("Filtering by service:", service);
      
     
      salons.forEach(salon => {
        console.log(`Salon ${salon.name} services:`, JSON.stringify(salon.services));
      });
      
      filteredSalons = salons.filter(salon =>
        Array.isArray(salon.services) && salon.services.some(srv => {
        
          const srvString = typeof srv === 'string' ? srv : JSON.stringify(srv);
          console.log(`Comparing service: "${srvString}" with "${service}"`);
          
    
          if (typeof srv === 'string') {
            return srv.trim().toLowerCase() === service.trim().toLowerCase();
          }
          
          if (srv && typeof srv === 'object') {
         
            const docObj = srv._doc || srv;
            console.log("Using document object:", JSON.stringify(docObj));
            
    
            if ('0' in docObj && '1' in docObj && '2' in docObj && '3' in docObj) {
              const directService = docObj['0'] + docObj['1'] + docObj['2'] + docObj['3'];
              console.log(`Direct service reconstruction: "${directService}"`);
              if (directService.trim().toLowerCase() === service.trim().toLowerCase()) {
                return true;
              }
            }
            
            
            if (docObj.name) {
              const normalize = str => str.normalize('NFD').replace(/[0-\u036f]/g, '').trim().toLowerCase();
              return normalize(docObj.name) === normalize(service);
            }
            if (docObj.title) {
              return docObj.title.trim().toLowerCase() === service.trim().toLowerCase();
            }
            if (docObj.serviceName) {
              return docObj.serviceName.trim().toLowerCase() === service.trim().toLowerCase();
            }
            
          
            const numericKeys = Object.keys(docObj)
              .filter(key => {
                const isNumeric = !isNaN(parseInt(key)) && key !== '_id';
                return isNumeric;
              })
              .sort((a, b) => parseInt(a) - parseInt(b));
            
            console.log(`Found numeric keys: [${numericKeys.join(', ')}]`);
            
           
            if (numericKeys.length > 0) {
              const reconstructedService = numericKeys.map(key => docObj[key]).join('');
              console.log(`Reconstructed service: "${reconstructedService}"`);
              return reconstructedService.trim().toLowerCase() === service.trim().toLowerCase();
            }
          }
          
          return false;
        })
      );
      console.log(`Filtered to ${filteredSalons.length} salons after service filter`);
    }

    res.json(filteredSalons);
  } catch (err) {
    console.error("Eroare la căutare saloane:", err);
    res.status(500).json({ message: "Eroare server la search." });
  }
});


router.put('/:id', async (req, res) => {
  try {
    const updatedSalon = await Salon.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    res.json(updatedSalon);
  } catch (error) {
    console.error('Eroare la actualizarea salonului:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});


router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
  
    if (!id || id === 'undefined') {
      console.log('Invalid salon ID provided:', id);
      return res.status(400).json({ message: 'ID de salon invalid.' });
    }
    
    
    if (!mongoose.Types.ObjectId.isValid(id)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Format ID salon invalid.' });
    }
    
    console.log('Looking for salon with ID:', id);
    const salon = await Salon.findById(id);
    
    if (!salon) {
      console.log('No salon found with ID:', id);
      return res.status(404).json({ message: 'Salonul nu a fost găsit.' });
    }
    
    console.log('Salon found:', salon.name);
    res.json(salon);
  } catch (error) {
    console.error('Eroare la obținerea salonului după ID:', error);
    res.status(500).json({ message: 'Eroare server.' });
  }
});

module.exports = router;
