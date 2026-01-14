const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Simple test route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from backend!' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
