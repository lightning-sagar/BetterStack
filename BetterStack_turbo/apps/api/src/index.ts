import express from 'express';
import { prisma } from 'store/client';

const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/', async (req, res) => {
  try {
    const { url }= req.body;
    if(!url) {
      return res.status(400).json({ message: 'URL is required' });
    }
    console.log('Received data:', req.body);
    await prisma.website.create({
      data: { url }
    });
    console.log('Website entry created for URL:', url);
    res.status(201).json({ message: 'Website created successfully' });
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




