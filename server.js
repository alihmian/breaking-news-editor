const express = require('express');
const fs = require('fs');
const path = require('path');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Serve static files from the public folder
app.use(express.static('public'));

// Accept large JSON (for base64 images)
app.use(bodyParser.json({ limit: '20mb' }));

// Route: Crop editor with token (serves the HTML page)
app.get('/crop/:token', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Route: Save cropped image from frontend
app.post('/save-cropped-image/:token', (req, res) => {
  const { token } = req.params;
  const { image } = req.body; // base64 image string

  if (!image) return res.status(400).send('No image provided');

  const buffer = Buffer.from(image, 'base64');
  const filename = `final_${token}.png`;
  const filePath = path.join(__dirname, 'public', filename);

  fs.writeFile(filePath, buffer, (err) => {
    if (err) {
      console.error('Failed to save image:', err);
      return res.status(500).send('Error saving image');
    }
    console.log('Image saved:', filePath);
    res.status(200).send('Image saved successfully');
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`✅ Server is running at http://localhost:${PORT}`);
});
