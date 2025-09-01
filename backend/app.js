// Import routes
const userRoutes = require('./routes/userRoutes');
const salonRoutes = require('./routes/salonRoutes');
const workerRoutes = require('./routes/workerRoutes');
const authRoutes = require('./routes/authRoutes');
const workerAuthRoutes = require('./routes/workerAuthRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const invitationRoutes = require('./routes/invitationRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const voucherRoutes = require('./routes/vouchers');

// Routes
app.use('/api/users', userRoutes);
app.use('/api/salons', salonRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/worker-auth', workerAuthRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/invitations', invitationRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/vouchers', voucherRoutes);
