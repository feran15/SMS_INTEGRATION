const twilio = require('twilio');

// Twilio credentials from your Twilio console
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

// Basic function to validate E.164 phone numbers
const isValidE164 = (number) => {
  const regex = /^\+?[1-9]\d{1,14}$/;
  return regex.test(number);
};

// Function to send an SMS
const sendSMS = async (to, body) => {
  try {
    if (!isValidE164(to)) {
      throw new Error(`Invalid phone number format: ${to}. Ensure it is in E.164 format.`);
    }

    const message = await client.messages.create({
      body: body,
      to: to, // Recipient's phone number in E.164 format
      from: process.env.TWILIO_PHONE_NUMBER || '+18647351707', // Your Twilio number
    });

    console.log(`Message sent to ${to}: ${message.sid}`);
    return message;
  } catch (error) {
    console.error('Error sending SMS:', error.message);
    throw error;
  }
};

module.exports = { sendSMS };
