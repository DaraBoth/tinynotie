import express from "express";
import serverless from "serverless-http";
const dotenv = require('dotenv');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth.js');
const noteRoutes = require('./routes/note.js');
const apiRoutes = require('./routes/api.js');
const api = express();

/* CONFIGURATIONS */
dotenv.config();
api.use(express.json())
api.use(helmet());
api.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
api.use(morgan("common"));
api.use(bodyParser.json({ limit: "30mb", extended: true }));
api.use(bodyParser.urlencoded({ limit: "30mb", extended: true }));
api.use(cors());

/* ROUTES */
api.use("/note", noteRoutes);
api.use("/api", apiRoutes);
api.use("/auth", authRoutes);

export const handler = serverless(api);