const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const twilio = require('twilio');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;
// Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// Middleware
app.use(cors());
app.use(express.json());

// Helper function for phone number validation
function isValidPhoneNumber(phoneNumber) {
  const phoneRegex = /^\+[1-9]\d{1,14}$/;
  return phoneRegex.test(phoneNumber);
}

// Route to send SMS
app.post('/api/sms/send', async (req, res) => {
  const { phoneNumber, message } = req.body;

  // Input validation
  if (!phoneNumber || !message) {
    return res.status(400).json({ success: false, error: 'Phone number and message are required' });
  }

  if (!isValidPhoneNumber(phoneNumber)) {
    return res.status(400).json({ success: false, error: 'Invalid phone number format' });
  }

  try {
    console.log(`Attempting to send SMS to: ${phoneNumber}`);
    // Send SMS using Twilio client
    const response = await client.messages.create({
      body: message,
      to: phoneNumber,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    console.log(`SMS sent successfully. SID: ${response.sid}`);
    res.status(200).json({ success: true, messageSid: response.sid });
  } catch (error) {
    console.error('Error sending SMS:', error);
    if (error.code === 21211) {
      res.status(400).json({ success: false, error: 'Invalid phone number' });
    } else if (error.code === 21608) {
      res.status(403).json({ success: false, error: 'Twilio account is not authorized to send messages to this number' });
    } else {
      res.status(500).json({ success: false, error: 'An error occurred while sending the SMS' });
    }
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
  console.log(`Twilio phone number: ${process.env.TWILIO_PHONE_NUMBER}`);
});