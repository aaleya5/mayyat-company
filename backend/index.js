const express = require('express')
const app = express()
app.use(express.json())
const db = require('./db');

const deathRoutes = require("./routes/deaths");
app.use("/api", deathRoutes);

const PORT=3000
app.listen(PORT,()=>{
  console.log(`Server running on port ${PORT}`)
})