// server.ts
import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import unzipper from 'unzipper';
import axios from 'axios';
import multer from 'multer';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

const BASE_DIR = path.resolve(__dirname, '..');
const rvcModelsDir = path.join(BASE_DIR, 'rvc_models');

// Helper: get current models (exclude some filenames)
app.get('/api/models/current', (req: Request, res: Response) => {
  try {
    const models = fs.readdirSync(rvcModelsDir);
    const itemsToRemove = ['hubert_base.pt', 'MODELS.txt', 'public_models.json', 'rmvpe.pt'];
    const filteredModels = models.filter(item => !itemsToRemove.includes(item));
    res.json(filteredModels);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Download an online model and extract it
app.post('/api/models/download', async (req: Request, res: Response) => {
  const { url, dirName } = req.body;
  const extractionFolder = path.join(rvcModelsDir, dirName);
  if (fs.existsSync(extractionFolder)) {
    return res.status(400).json({ error: `Voice model directory ${dirName} already exists!` });
  }
  try {
    // Download zip file
    const response = await axios({
      url,
      method: 'GET',
      responseType: 'stream'
    });
    const zipName = path.basename(url);
    const zipPath = path.join(BASE_DIR, zipName);
    const writer = fs.createWriteStream(zipPath);
    response.data.pipe(writer);
    writer.on('finish', () => {
      fs.mkdirSync(extractionFolder);
      // Extract the zip file
      fs.createReadStream(zipPath)
        .pipe(unzipper.Extract({ path: extractionFolder }))
        .on('close', () => {
          fs.unlinkSync(zipPath);
          // (Additional logic to locate/move .pth and .index files would go here)
          res.json({ message: `${dirName} Model successfully downloaded!` });
        });
    });
    writer.on('error', err => {
      res.status(500).json({ error: err.message });
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Upload a local model zip file and extract it
app.post('/api/models/upload', upload.single('zipFile'), (req: Request, res: Response) => {
  const { dirName } = req.body;
  const extractionFolder = path.join(rvcModelsDir, dirName);
  if (fs.existsSync(extractionFolder)) {
    return res.status(400).json({ error: `Voice model directory ${dirName} already exists!` });
  }
  try {
    fs.mkdirSync(extractionFolder);
    const zipPath = req.file.path;
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractionFolder }))
      .on('close', () => {
        fs.unlinkSync(zipPath);
        res.json({ message: `${dirName} Model successfully uploaded!` });
      })
      .on('error', (err) => {
        res.status(500).json({ error: err.message });
      });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
