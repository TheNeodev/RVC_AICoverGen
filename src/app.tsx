// App.tsx
import React, { useState, useEffect, ChangeEvent } from 'react';
import axios from 'axios';
import { AppBar, Tabs, Tab, Box, Button, TextField, Select, MenuItem, Typography } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const App: React.FC = () => {
  const [tabIndex, setTabIndex] = useState(0);
  const [voiceModels, setVoiceModels] = useState<string[]>([]);
  const [downloadUrl, setDownloadUrl] = useState('');
  const [modelName, setModelName] = useState('');
  const [message, setMessage] = useState('');
  const [fileToUpload, setFileToUpload] = useState<File | null>(null);

  // Fetch current models on load
  useEffect(() => {
    axios.get('/api/models/current')
      .then(response => setVoiceModels(response.data))
      .catch(error => console.error(error));
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
    setMessage('');
  };

  // Call the download endpoint
  const handleDownload = async () => {
    try {
      const response = await axios.post('/api/models/download', { url: downloadUrl, dirName: modelName });
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Error downloading model.');
    }
  };

  // Call the upload endpoint
  const handleUpload = async () => {
    if (!fileToUpload) return;
    const formData = new FormData();
    formData.append('zipFile', fileToUpload);
    formData.append('dirName', modelName);
    try {
      const response = await axios.post('/api/models/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setMessage(response.data.message);
    } catch (error: any) {
      setMessage(error.response?.data?.error || 'Error uploading model.');
    }
  };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFileToUpload(e.target.files[0]);
    }
  };

  return (
    <Box sx={{ width: '80%', margin: 'auto', mt: 4 }}>
      <AppBar position="static">
        <Tabs value={tabIndex} onChange={handleTabChange}>
          <Tab label="Generate" />
          <Tab label="Download Model" />
          <Tab label="Upload Model" />
        </Tabs>
      </AppBar>
      <TabPanel value={tabIndex} index={0}>
        <Typography variant="h6">Generate AI Cover</Typography>
        <TextField
          fullWidth
          label="Song Input (YouTube link or local path)"
          margin="normal"
        />
        <Select
          fullWidth
          value={voiceModels[0] || ''}
          onChange={(e) => setModelName(e.target.value)}
          displayEmpty
        >
          {voiceModels.map((model, idx) => (
            <MenuItem key={idx} value={model}>
              {model}
            </MenuItem>
          ))}
        </Select>
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary">Generate</Button>
        </Box>
      </TabPanel>
      <TabPanel value={tabIndex} index={1}>
        <Typography variant="h6">Download Model</Typography>
        <TextField
          fullWidth
          label="Download Link"
          margin="normal"
          value={downloadUrl}
          onChange={e => setDownloadUrl(e.target.value)}
        />
        <TextField
          fullWidth
          label="Model Name"
          margin="normal"
          value={modelName}
          onChange={e => setModelName(e.target.value)}
        />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleDownload}>Download Model</Button>
        </Box>
        {message && <Typography color="secondary" sx={{ mt: 2 }}>{message}</Typography>}
      </TabPanel>
      <TabPanel value={tabIndex} index={2}>
        <Typography variant="h6">Upload Model</Typography>
        <input type="file" accept=".zip" onChange={onFileChange} />
        <TextField
          fullWidth
          label="Model Name"
          margin="normal"
          value={modelName}
          onChange={e => setModelName(e.target.value)}
        />
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" color="primary" onClick={handleUpload}>Upload Model</Button>
        </Box>
        {message && <Typography color="secondary" sx={{ mt: 2 }}>{message}</Typography>}
      </TabPanel>
    </Box>
  );
};

export default App;
