const express = require('express');
const router = express.Router();
const Booking = require('../Booking');
const Worker = require('../Worker');
const Salon = require('../Salon');
const Voucher = require('../Voucher'); 
const { isValidObjectId } = require('mongoose');

// Get available time slots for a worker on a specific date
router.get('/available-slots', async (req, res) => {
  try {
    const { workerId, date, service } = req.query;

    console.log(`[available-slots] Request for worker: ${workerId}, date: ${date}, service: ${service || '<empty>'}`);

    if (!workerId || !date) {
      return res.status(400).json({ message: 'Worker ID and date are required' });
    }

    const serviceToUse = service || 'Consultație';
    console.log(`[available-slots] Using service: ${serviceToUse}`);

    if (!isValidObjectId(workerId)) {
      return res.status(400).json({ message: 'Invalid worker ID format' });
    }


    const bookingDate = new Date(date);

    bookingDate.setHours(0, 0, 0, 0);


    const dayOfWeek = bookingDate.getDay();
    const daysOfWeek = ['Duminică', 'Luni', 'Marți', 'Miercuri', 'Joi', 'Vineri', 'Sâmbătă'];
    const dayName = daysOfWeek[dayOfWeek];

    console.log(`[available-slots] Date ${date} is ${dayName}`);


    const worker = await Worker.findById(workerId);

    if (!worker) {
      console.log(`[available-slots] Worker ${workerId} not found`);
      return res.status(404).json({ message: 'Worker not found' });
    }

    // Check if worker provides the requested service
    if (!worker.services.includes(serviceToUse)) {

      const hasService = worker.services.some(workerService => {
        if (typeof workerService === 'string') {
          return workerService.trim().toLowerCase() === serviceToUse.trim().toLowerCase();
        } else if (workerService && typeof workerService === 'object') {
          if (workerService.name) {
            return workerService.name.trim().toLowerCase() === serviceToUse.trim().toLowerCase();
          }


          const numericKeys = Object.keys(workerService)
            .filter(key => !isNaN(parseInt(key)) && key !== '_id')
            .sort((a, b) => parseInt(a) - parseInt(b));

          if (numericKeys.length > 0) {
            const serviceStr = numericKeys.map(key => workerService[key]).join('');
            return serviceStr.trim().toLowerCase() === serviceToUse.trim().toLowerCase();
          }
        }
        return false;
      });


      const isGenericService = !serviceToUse ||
        serviceToUse.trim().toLowerCase() === 'consultație' ||
        serviceToUse.trim().toLowerCase() === 'consultatie' ||
        serviceToUse.trim().toLowerCase() === 'any service';

      if (!hasService && !isGenericService) {
        console.log(`Worker does not provide service: ${serviceToUse}`);
        console.log('Available services:', worker.services);


        worker.serviceWarning = `Worker may not officially provide the ${serviceToUse} service`;
      }
    }

    const availability = worker.availability.find(a => a.dayOfWeek === dayName);

    if (!availability) {
      console.log(`Worker ${workerId} has no specific availability for ${dayName}`);

      // Try to get the salon's working hours for this day as a fallback
      const salon = await Salon.findById(worker.salonId);
      const salonHours = salon?.workingHours?.find(wh => wh.dayOfWeek === dayName);

      if (salonHours) {
        console.log(`Using salon hours for ${dayName} as fallback`);

        const startTime = salonHours.from.split(':').map(Number);
        const endTime = salonHours.to.split(':').map(Number);

        // Generate all possible 1-hour slots using salon hours
        const availableSlots = [];
        const nextDayDate = new Date(bookingDate);
        nextDayDate.setDate(nextDayDate.getDate() + 1);

        // Get existing bookings for this worker on this date
        const existingBookings = await Booking.find({
          workerId,
          date: {
            $gte: bookingDate,
            $lt: nextDayDate
          },
          status: { $ne: 'cancelled' }
        });


        const workerBookingsForDay = worker.bookings?.filter(booking => {
          const bookingDate = new Date(booking.date);
          return bookingDate.toDateString() === new Date(date).toDateString();
        }) || [];


        const occupiedSlots = new Set([
          ...existingBookings.map(booking => booking.timeSlot),
          ...workerBookingsForDay.map(booking => booking.timeSlot)
        ]);

        console.log(`Found ${occupiedSlots.size} occupied slots for worker ${workerId} on ${date}`);


        for (let hour = startTime[0]; hour < endTime[0]; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;

          // Check if this slot is already booked
          if (!occupiedSlots.has(timeSlot)) {
            availableSlots.push(timeSlot);
          }
        }

        console.log(`[available-slots] Generated ${availableSlots.length} available slots for ${dayName}: ${JSON.stringify(availableSlots)}`);

        return res.json({
          worker: {
            id: worker._id,
            name: worker.name,
            surname: worker.surname
          },
          date: bookingDate,
          dayOfWeek: dayName,
          availableSlots,
          note: 'Using salon hours (worker has no specific availability)'
        });
      } else {
     
        console.log(`Using default hours (9 AM - 5 PM) for ${dayName}`);
        const defaultStartHour = 9;
        const defaultEndHour = 17;

 
        const availableSlots = [];
        const nextDayDate = new Date(bookingDate);
        nextDayDate.setDate(nextDayDate.getDate() + 1);

 
        const existingBookings = await Booking.find({
          workerId,
          date: {
            $gte: bookingDate,
            $lt: nextDayDate
          },
          status: { $ne: 'cancelled' }
        });

     
        const workerBookingsForDay = worker.bookings?.filter(booking => {
          const bookingDate = new Date(booking.date);
          return bookingDate.toDateString() === new Date(date).toDateString();
        }) || [];


        const occupiedSlots = new Set([
          ...existingBookings.map(booking => booking.timeSlot),
          ...workerBookingsForDay.map(booking => booking.timeSlot)
        ]);

        console.log(`Found ${occupiedSlots.size} occupied slots for worker ${workerId} on ${date}`);

        for (let hour = defaultStartHour; hour < defaultEndHour; hour++) {
          const timeSlot = `${hour.toString().padStart(2, '0')}:00`;

          if (!occupiedSlots.has(timeSlot)) {
            availableSlots.push(timeSlot);
          }
        }

        console.log(`[available-slots] Generated ${availableSlots.length} available slots for ${dayName}: ${JSON.stringify(availableSlots)}`);

        return res.json({
          worker: {
            id: worker._id,
            name: worker.name,
            surname: worker.surname
          },
          date: bookingDate,
          dayOfWeek: dayName,
          availableSlots,
          note: 'Using default hours (9 AM - 5 PM)'
        });
      }
    }


    const startTime = availability.from.split(':').map(Number);
    const endTime = availability.to.split(':').map(Number);

    const availableSlots = [];
    const nextDayDate = new Date(bookingDate);
    nextDayDate.setDate(nextDayDate.getDate() + 1);


    const existingBookings = await Booking.find({
      workerId,
      date: {
        $gte: bookingDate,
        $lt: nextDayDate
      },
      status: { $ne: 'cancelled' }
    });

    const workerBookingsForDay = worker.bookings?.filter(booking => {
      const bookingDate = new Date(booking.date);
      return bookingDate.toDateString() === new Date(date).toDateString();
    }) || [];


    const occupiedSlots = new Set([
      ...existingBookings.map(booking => booking.timeSlot),
      ...workerBookingsForDay.map(booking => booking.timeSlot)
    ]);

    console.log(`Found ${occupiedSlots.size} occupied slots for worker ${workerId} on ${date}`);


    for (let hour = startTime[0]; hour < endTime[0]; hour++) {
      const timeSlot = `${hour.toString().padStart(2, '0')}:00`;


      if (!occupiedSlots.has(timeSlot)) {
        availableSlots.push(timeSlot);
      }
    }

    console.log(`[available-slots] Generated ${availableSlots.length} available slots for ${dayName}: ${JSON.stringify(availableSlots)}`);

    res.json({
      worker: {
        id: worker._id,
        name: worker.name,
        surname: worker.surname
      },
      date: bookingDate,
      dayOfWeek: dayName,
      availableSlots
    });
  } catch (error) {
    console.error('[available-slots] Error fetching available slots:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.post('/', async (req, res) => {
  try {
    const {
      userId,
      salonId,
      workerId,
      service,
      date,
      timeSlot,
      clientName,
      clientEmail,
      clientPhone,
      paymentMethod,
      voucherId,
      voucherCode,
      totalAmount
    } = req.body;
    

    console.log('🎫 Creating booking with payment method:', paymentMethod);


    if (!salonId || !workerId || !service || !date || !timeSlot || !clientName || !clientEmail || !clientPhone) {
      return res.status(400).json({ message: 'All fields are required except userId' });
    }


    if (
      (userId && !isValidObjectId(userId)) ||
      !isValidObjectId(salonId) ||
      !isValidObjectId(workerId)
    ) {
      return res.status(400).json({ message: 'Invalid ID format' });
    }

    const bookingDate = new Date(date);


    bookingDate.setHours(0, 0, 0, 0);


    const worker = await Worker.findById(workerId);
    if (!worker) {
      return res.status(404).json({ message: 'Worker not found' });
    }


    const salon = await Salon.findById(salonId);
    if (!salon) {
      return res.status(404).json({ message: 'Salon not found' });
    }


    if (worker.salonId.toString() !== salonId) {
      return res.status(400).json({ message: 'Worker is not associated with the salon' });
    }


    if (!worker.services.includes(service)) {

      const hasService = worker.services.some(workerService => {
        if (typeof workerService === 'string') {
          return workerService.trim().toLowerCase() === service.trim().toLowerCase();
        } else if (workerService && typeof workerService === 'object') {
          if (workerService.name) {
            return workerService.name.trim().toLowerCase() === service.trim().toLowerCase();
          }


          const numericKeys = Object.keys(workerService)
            .filter(key => !isNaN(parseInt(key)) && key !== '_id')
            .sort((a, b) => parseInt(a) - parseInt(b));

          if (numericKeys.length > 0) {
            const serviceStr = numericKeys.map(key => workerService[key]).join('');
            return serviceStr.trim().toLowerCase() === service.trim().toLowerCase();
          }
        }
        return false;
      });


      const isGenericService = !service ||
        service.trim().toLowerCase() === 'consultație' ||
        service.trim().toLowerCase() === 'consultatie' ||
        service.trim().toLowerCase() === 'any service';

      if (!hasService && !isGenericService) {
        console.log(`Worker does not provide service: ${service}`);
        console.log('Available services:', worker.services);


        worker.serviceWarning = `Worker may not officially provide the ${service} service`;
      }
    }


    const nextDayDate = new Date(bookingDate);
    nextDayDate.setDate(nextDayDate.getDate() + 1);

    const existingBooking = await Booking.findOne({
      workerId,
      date: {
        $gte: bookingDate,
        $lt: nextDayDate
      },
      timeSlot,
      status: { $ne: 'cancelled' }
    });

    if (existingBooking) {
      return res.status(409).json({ message: 'This time slot is already booked' });
    }


    const bookingData = {
      userId,
      salonId,
      workerId,
      service,
      date: bookingDate,
      timeSlot,
      clientName,
      clientEmail,
      clientPhone,
      paymentMethod: paymentMethod || 'location',
      totalAmount: totalAmount || 0,
      paidAmount: 0
    };

    if (paymentMethod === 'voucher' && userId && (voucherId || voucherCode)) {
      console.log('🎁 Processing voucher payment using:', voucherId || voucherCode);

      const voucher = await Voucher.findOne({
        ...(voucherId ? { _id: voucherId } : { code: voucherCode }),
        used: false
      });

      if (!voucher) {
        return res.status(400).json({ message: 'Invalid or already used voucher' });
      }

      if (new Date() > voucher.expiresAt) {
        return res.status(400).json({ message: 'Voucher has expired' });
      }


      if (voucher.amount < totalAmount) {
        return res.status(400).json({
          message: `Voucher amount insufficient. Required: ${totalAmount} RON, Available: ${voucher.amount} RON`
        });
      }


      const booking = new Booking(bookingData);
      await booking.save();
      console.log('✅ Booking created with ID:', booking._id);


      voucher.used = true;
      voucher.usedAt = new Date();
      voucher.usedForBooking = booking._id;
      await voucher.save();
      console.log('✅ Voucher marked as used:', voucher.code);

      booking.voucherUsed = voucher._id;
      booking.paidAmount = Math.min(totalAmount, voucher.amount);
      await booking.save();


      worker.bookings = worker.bookings || [];
      worker.bookings.push({
        date: bookingDate,
        timeSlot,
        createdAt: new Date()
      });
      await worker.save();
      console.log(`Added booking to worker's bookings array: ${worker._id}`);

      return res.status(201).json({
        message: 'Booking created successfully with voucher payment',
        booking: {
          id: booking._id,
          date: booking.date,
          timeSlot: booking.timeSlot,
          status: booking.status,
          paymentMethod: booking.paymentMethod,
          totalAmount: booking.totalAmount,
          paidAmount: booking.paidAmount,
          worker: {
            id: worker._id,
            name: worker.name,
            surname: worker.surname
          },
          salon: {
            id: salon._id,
            name: salon.name
          },
          service: booking.service
        },
        voucherUsed: {
          code: voucher.code,
          amount: voucher.amount,
          remaining: voucher.amount - totalAmount
        }
      });
    }


    const booking = new Booking(bookingData);
    await booking.save();


    worker.bookings = worker.bookings || [];
    worker.bookings.push({
      date: bookingDate,
      timeSlot,
      createdAt: new Date()
    });

    await worker.save();
    console.log(`Added booking to worker's bookings array: ${worker._id}`);

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: booking._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        totalAmount: booking.totalAmount,
        worker: {
          id: worker._id,
          name: worker.name,
          surname: worker.surname
        },
        salon: {
          id: salon._id,
          name: salon.name
        },
        service: booking.service
      }
    });
  } catch (error) {
    console.error('❌ Error creating booking:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});


router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: 'Invalid user ID format' });
    }

    const bookings = await Booking.find({ userId })
      .populate('voucherUsed', 'code amount')
      .sort({ date: -1, timeSlot: 1 });

    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const worker = await Worker.findById(booking.workerId);
      const salon = await Salon.findById(booking.salonId);

      return {
        id: booking._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount,
        voucherUsed: booking.voucherUsed,
        worker: worker ? {
          id: worker._id,
          name: worker.name,
          surname: worker.surname
        } : null,
        salon: salon ? {
          id: salon._id,
          name: salon.name,
          address: salon.address
        } : null
      };
    }));

    res.json(populatedBookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/salon/:salonId', async (req, res) => {
  try {
    const { salonId } = req.params;

    if (!isValidObjectId(salonId)) {
      return res.status(400).json({ message: 'Invalid salon ID format' });
    }

    const bookings = await Booking.find({ salonId })
      .populate('voucherUsed', 'code amount')
      .sort({ date: -1, timeSlot: 1 });

  
    const populatedBookings = await Promise.all(bookings.map(async (booking) => {
      const worker = await Worker.findById(booking.workerId);

      return {
        id: booking._id,
        date: booking.date,
        timeSlot: booking.timeSlot,
        service: booking.service,
        status: booking.status,
        paymentMethod: booking.paymentMethod,
        totalAmount: booking.totalAmount,
        paidAmount: booking.paidAmount,
        voucherUsed: booking.voucherUsed,
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        clientPhone: booking.clientPhone,
        worker: worker ? {
          id: worker._id,
          name: worker.name,
          surname: worker.surname
        } : null
      };
    }));

    res.json(populatedBookings);
  } catch (error) {
    console.error('Error fetching salon bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.get('/worker/:workerId', async (req, res) => {
  try {
    const { workerId } = req.params;

    if (!isValidObjectId(workerId)) {
      return res.status(400).json({ message: 'Invalid worker ID format' });
    }

    const bookings = await Booking.find({ workerId })
      .populate('voucherUsed', 'code amount')
      .sort({ date: -1, timeSlot: 1 });

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching worker bookings:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


router.put('/:id/cancel', async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }

    const booking = await Booking.findById(id).populate('voucherUsed');

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }


    if (booking.voucherUsed) {
      console.log('🔄 Restoring voucher due to booking cancellation:', booking.voucherUsed.code);


      const restoredVoucher = new Voucher({
        code: Voucher.generateVoucherCode(),
        amount: booking.voucherUsed.amount,
        userId: booking.userId,
        paymentIntentId: `restored_${Date.now()}`,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) 
      });

      await restoredVoucher.save();
      console.log('✅ New voucher created due to cancellation:', restoredVoucher.code);
    }

    booking.status = 'cancelled';
    await booking.save();


    try {
      const worker = await Worker.findById(booking.workerId);
      if (worker && worker.bookings && worker.bookings.length > 0) {
     
        const bookingDate = new Date(booking.date);
        bookingDate.setHours(0, 0, 0, 0);

        worker.bookings = worker.bookings.filter(workerBooking => {
          const workerBookingDate = new Date(workerBooking.date);
          workerBookingDate.setHours(0, 0, 0, 0);


          return !(workerBookingDate.getTime() === bookingDate.getTime() &&
            workerBooking.timeSlot === booking.timeSlot);
        });

        await worker.save();
        console.log(`Removed cancelled booking from worker's bookings array: ${worker._id}`);
      }
    } catch (workerErr) {
      console.error('Error updating worker bookings array:', workerErr);

    }

    res.json({
      message: 'Booking cancelled successfully',
      booking,
      voucherRestored: !!booking.voucherUsed
    });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;