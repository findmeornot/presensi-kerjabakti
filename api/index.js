import express from 'express';
import cors from 'cors';
import { apiRouter } from '../api-router.js';

const app = express();

app.use(cors());
app.use(express.json());

// Support both /api prefix and direct rewrite
app.use('/api', apiRouter);
app.use(apiRouter);

export default app;
