import express from 'express';
import cors from 'cors';
import blastApi from './blast-api.js';

const app = express();
app.use(cors());
app.use(express.json({ limit: '5mb' }));

app.use('/api/blast', blastApi);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`BLAST API server running on port ${PORT}`);
});