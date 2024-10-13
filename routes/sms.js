const express = require('express');
const router = express.Router();
const { sendSMS } = require('../services/twilioService');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');
const basicAuth = require('express-basic-auth');

// Basic authentication middleware
const auth = basicAuth({
  users: { 'admin': process.env.API_PASSWORD },
  challenge: true,
  realm: 'SMS API',
});

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Input validation middleware
const validateInput = [
  body('phoneNumber').isMobilePhone().withMessage('Invalid phone number'),
  body('message').isLength({ min: 1, max: 160 }).withMessage('Message must be between 1 and 160 characters'),
];

// Route to send an SMS
router.post('/send', auth, limiter, validateInput, async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }

  const { phoneNumber, message } = req.body;
  try {
    const response = await sendSMS(phoneNumber, message);
    res.status(200).json({ success: true, response });
  } catch (error) {
    console.error('SMS sending error:', error);
    if (error.code === 21211) {
      res.status(400).json({ success: false, error: 'Invalid phone number' });
    } else if (error.code === 21608) {
      res.status(403).json({ success: false, error: 'Unable to send SMS to this number' });
    } else {
      res.status(500).json({ success: false, error: 'An error occurred while sending the SMS' });
    }
  }
});

module.exports = router;