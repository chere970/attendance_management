import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import homeRouter from './routes/home'

// Define the Express application instance with the Express type
const app: Express = express();
const PORT: number = 5000;
const MONGO_URI= process.env.MONGODB_URL || "set your database address" ;
// Connect to MongoDB
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch((err: Error) => {
    console.error('MongoDB connection error:', err);
  });

// Basic Express route with explicit types for request and response
app.use('/',homeRouter);
app.use('/user', homeRouter);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
export default app;