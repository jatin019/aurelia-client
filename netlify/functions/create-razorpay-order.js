// netlify/functions/create-razorpay-order.js
// Place this file at: your-client-project/netlify/functions/create-razorpay-order.js
//
// Install dependency in your client project root:
//   npm install razorpay
//
// Add these env vars in Netlify Dashboard → Site Settings → Environment Variables:
//   RAZORPAY_KEY_ID       = rzp_live_xxxx  (or rzp_test_xxxx for testing)
//   RAZORPAY_KEY_SECRET   = your_secret_key

const Razorpay = require('razorpay');

exports.handler = async (event) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  // Check env vars are set
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    console.error('Razorpay env vars not set');
    return { statusCode: 500, body: JSON.stringify({ error: 'Payment gateway not configured' }) };
  }

  try {
    const { amount, currency = 'INR', receipt, notes = {} } = JSON.parse(event.body);

    if (!amount || amount < 1) {
      return { statusCode: 400, body: JSON.stringify({ error: 'Invalid amount' }) };
    }

    const razorpay = new Razorpay({
      key_id:     process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount:   Math.round(amount * 100), // convert ₹ to paise
      currency,
      receipt:  receipt || `rcpt_${Date.now()}`,
      notes,
    });

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    };
  } catch (err) {
    console.error('Razorpay order creation failed:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message || 'Failed to create payment order' }),
    };
  }
};