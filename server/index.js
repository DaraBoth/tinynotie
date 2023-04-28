const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth.js');
const noteRoutes = require('./routes/note.js');
const apiRoutes = require('./routes/api.js');
const app = express();

/* CONFIGURATIONS */
dotenv.config();
app.use(express.json())
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "30mb", extended: true }));
app.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
app.use(cors());

/* ROUTES */
app.use("/note", noteRoutes);
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

/* SERVER SETUP */
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});