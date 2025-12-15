import express from 'express';

const app = express();
const PORT = process.env.PORT || 5000;

app.post('/', async (req, res) => {
  try {
    const data = req.body;
    console.log('Received data:', data);
    res.status(200).json({ message: 'Data received successfully', data });
  } catch (error) {
    console.error('Error processing request:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
})

app.get('/status/:webId', (req, res) => {
  res.send('Welcome to the API!');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




