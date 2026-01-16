const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// We only import the Route, not the DB file
const eventRoute = require('./routes/eventRoute'); 

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// Mount the route
app.use('/api/events', eventRoute);

// Simple test route (No DB required)
app.get("/", (req, res) => {
  res.send("Server is running!");
});

const port = process.env.PORT || 8080;

app.listen(port, "0.0.0.0", () => {
  console.log(`Server is running live on port ${port}`);
});
