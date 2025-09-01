
const express = require('express');
const router = express.Router();
const Voucher = require('../Voucher');
const auth = require('../middlewares/jwtMiddleware');


let stripe;
try {
    if (false) {
        console.error('⚠️  STRIPE_SECRET_KEY not found in environment variables');
        throw new Error('STRIPE_SECRET_KEY is required');
    }
    stripe = require('stripe')("sk_test_51RaFuWFLLpJHHcCKWVPuyOoXPfF2ma3Uwx1jQ2wfyr6nYK9k9KS1bHYZpiLTSaHVWwHOvkfR7fSTdnPdTRf0YbB500i8ufjnMM");
    console.log('✅ Stripe initialized successfully');
} catch (error) {
    console.error('❌ Failed to initialize Stripe:', error.message);
}


router.get('/my-vouchers', auth, async (req, res) => {
    try {
        console.log('📡 Fetching vouchers for user:', req.userId);

        const vouchers = await Voucher.find({ userId: req.userId })
            .sort({ createdAt: -1 });

        console.log(`✅ Found ${vouchers.length} vouchers for user`);
        res.json(vouchers);
    } catch (error) {
        console.error('❌ Error fetching vouchers:', error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
});

// Create payment intent for voucher purchase
router.post('/create-payment-intent', auth, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ message: 'Stripe not initialized. Check server configuration.' });
        }

        const { amount } = req.body;
        console.log('💳 Creating payment intent for amount:', amount);

    
        if (![100, 200, 500].includes(amount)) {
            return res.status(400).json({ message: 'Invalid voucher amount. Must be 100, 200, or 500 RON.' });
        }


        const paymentIntent = await stripe.paymentIntents.create({
            amount: amount * 100, 
            currency: 'ron',
            automatic_payment_methods: {
                enabled: true,
            },
            metadata: {
                userId: req.userId,
                voucherAmount: amount,
                type: 'voucher_purchase'
            }
        });

        console.log('✅ Payment intent created:', paymentIntent.id);

        res.json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentId: paymentIntent.id
        });
    } catch (error) {
        console.error('❌ Error creating payment intent:', error);
        res.status(500).json({
            message: 'Failed to create payment intent',
            error: error.message
        });
    }
});

// Create voucher after successful payment
router.post('/create', auth, async (req, res) => {
    try {
        if (!stripe) {
            return res.status(500).json({ message: 'Stripe not initialized. Check server configuration.' });
        }

        const { amount, paymentIntentId } = req.body;
        console.log('🎁 Creating voucher for payment:', paymentIntentId);

 
        if (![100, 200, 500].includes(amount)) {
            return res.status(400).json({ message: 'Invalid voucher amount' });
        }

        if (!paymentIntentId) {
            return res.status(400).json({ message: 'Payment intent ID is required' });
        }


        let paymentIntent;
        try {
            paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            console.log('💳 Payment intent status:', paymentIntent.status);
        } catch (stripeError) {
            console.error('❌ Stripe API error:', stripeError);
            return res.status(400).json({ message: 'Invalid payment intent ID' });
        }

        if (paymentIntent.status !== 'succeeded') {
            return res.status(400).json({
                message: `Payment not successful. Status: ${paymentIntent.status}`
            });
        }

        if (paymentIntent.metadata.userId !== req.userId) {
            return res.status(400).json({ message: 'Payment intent user mismatch' });
        }


        const existingVoucher = await Voucher.findOne({ paymentIntentId });
        if (existingVoucher) {
            console.log('⚠️  Voucher already exists for payment:', paymentIntentId);
            return res.status(400).json({ message: 'Voucher already created for this payment' });
        }

        // Generate unique voucher code
        let code;
        let isUnique = false;
        let attempts = 0;
        while (!isUnique && attempts < 10) {
            code = Voucher.generateVoucherCode();
            const existing = await Voucher.findOne({ code });
            if (!existing) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({ message: 'Failed to generate unique voucher code' });
        }

        // Create voucher
        const voucher = new Voucher({
            code,
            amount,
            userId: req.userId,
            paymentIntentId
        });

        await voucher.save();
        console.log('✅ Voucher created successfully:', voucher.code);

        res.status(201).json({
            message: 'Voucher created successfully',
            voucher: {
                _id: voucher._id,
                code: voucher.code,
                amount: voucher.amount,
                createdAt: voucher.createdAt,
                expiresAt: voucher.expiresAt
            }
        });
    } catch (error) {
        console.error('❌ Error creating voucher:', error);
        res.status(500).json({ message: 'Failed to create voucher', error: error.message });
    }
});

// Use voucher for booking
router.post('/use-voucher', auth, async (req, res) => {
    try {
        const { voucherId, bookingId } = req.body;
        console.log('🎫 Using voucher:', voucherId, 'for booking:', bookingId);

        const voucher = await Voucher.findOne({
            _id: voucherId,
            userId: req.userId,
            used: false
        });

        if (!voucher) {
            return res.status(404).json({ message: 'Voucher not found or already used' });
        }

        // Check if voucher is expired
        if (new Date() > voucher.expiresAt) {
            return res.status(400).json({ message: 'Voucher has expired' });
        }

        // Mark voucher as used
        voucher.used = true;
        voucher.usedAt = new Date();
        voucher.usedForBooking = bookingId;

        await voucher.save();
        console.log('✅ Voucher marked as used:', voucher.code);

        res.json({
            message: 'Voucher used successfully',
            voucher: {
                _id: voucher._id,
                code: voucher.code,
                amount: voucher.amount,
                usedAt: voucher.usedAt
            }
        });
    } catch (error) {
        console.error('❌ Error using voucher:', error);
        res.status(500).json({ message: 'Failed to use voucher' });
    }
});

// Validate voucher (for booking confirmation)
router.post('/validate', auth, async (req, res) => {
    try {
        const { voucherId, amount } = req.body;

        const voucher = await Voucher.findOne({
            _id: voucherId,
            userId: req.userId,
            used: false
        });

        if (!voucher) {
            return res.status(404).json({
                valid: false,
                message: 'Voucher not found or already used'
            });
        }

    
        if (new Date() > voucher.expiresAt) {
            return res.status(400).json({
                valid: false,
                message: 'Voucher has expired'
            });
        }

        // Check if voucher amount covers the service
        if (voucher.amount < amount) {
            return res.status(400).json({
                valid: false,
                message: `Voucher amount (${voucher.amount} RON) is less than service cost (${amount} RON)`
            });
        }

        res.json({
            valid: true,
            voucher: {
                _id: voucher._id,
                code: voucher.code,
                amount: voucher.amount,
                remaining: voucher.amount - amount
            }
        });
    } catch (error) {
        console.error('Error validating voucher:', error);
        res.status(500).json({ message: 'Failed to validate voucher' });
    }
});


router.get('/stripe-status', (req, res) => {
    res.json({
        stripeConfigured: !!stripe,
        hasSecretKey: !!process.env.STRIPE_SECRET_KEY,
        timestamp: new Date().toISOString()
    });
});


router.post('/use-by-code', auth, async (req, res) => {
    try {
        const { code, bookingId } = req.body;
        console.log('🎫 Using voucher by code:', code, 'for booking:', bookingId);

        if (!code) {
            return res.status(400).json({ message: 'Voucher code is required' });
        }

        const voucher = await Voucher.findOne({
            code: code,
            userId: req.userId,
            used: false
        });

        if (!voucher) {
            return res.status(404).json({ message: 'Voucher not found or already used' });
        }

      
        if (new Date() > voucher.expiresAt) {
            return res.status(400).json({ message: 'Voucher has expired' });
        }

     
        voucher.used = true;
        voucher.usedAt = new Date();
        voucher.usedForBooking = bookingId;

        await voucher.save();
        console.log('Voucher marked as used:', voucher.code);

        res.json({
            message: 'Voucher used successfully',
            voucher: {
                _id: voucher._id,
                code: voucher.code,
                amount: voucher.amount,
                usedAt: voucher.usedAt
            }
        });
    } catch (error) {
        console.error('Error using voucher by code:', error);
        res.status(500).json({ message: 'Failed to use voucher by code' });
    }
});


module.exports = router;