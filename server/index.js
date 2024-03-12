import express from "express" 
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import bodyParser from "body-parser"
import { Configuration, OpenAIApi } from "openai";
import authRoutes from "./routes/auth.js"
import noteRoutes from "./routes/note.js"
import apiRoutes from "./routes/api.js"
import openAiRoutes from "./routes/openai.js";

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

/* OPEN AI CONFIGURATION */
const configuration = new Configuration({
  apiKey: process.env.OPEN_API_KEY,
});
export const openai = new OpenAIApi(configuration);

/* ROUTES */
app.use("/note", noteRoutes);
app.use("/openai", openAiRoutes);
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);

/* SERVER SETUP */
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});
module.exports = app;