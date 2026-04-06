require('dotenv').config();
import express from 'express';
import { routes } from './route/index.js';
import cors from 'cors';

const allowedOrigins = [
  "http://localhost:3000",
];


const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: allowedOrigins }));
app.use(routes());

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});




