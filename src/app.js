const express = require('express');
const quoteService = require('./services/quoteService');
const { connectDB } = require('./mongodb');

const app = express();
// Init connection to MongoDB
connectDB();

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.get('/stoic-quote', async (req, res) => {
  try {
    const quotes = await quoteService.getRandomSingleQuote({ category: 'stoic' });
    console.log('Returned quotes', quotes);
    return res.json({ data: quotes[0] });
  } catch (err) {
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/quote', async (req, res) => {
  try {
    const quote = await quoteService.upsertQuote(req.body);
    return res.json({ data: quote });
  } catch (err) {
    if (err.message === 'author and quote are required') {
      return res.status(400).json({ error: err.message });
    }
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = app;