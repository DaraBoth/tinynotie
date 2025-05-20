import express from "express"
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import bodyParser from "body-parser"
import fileUpload from "express-fileupload"
import authRoutes from "./routes/auth.js"
import apiRoutes from "./routes/api.js"
import openAiRoutes from "./routes/openai.js";
import telegrambotRoutes from "./routes/telegrambot.js";
import daraboth from "./routes/daraboth.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("./package.json");

const app = express();

/* CONFIGURATIONS */
dotenv.config();
app.use(express.json())
app.use(helmet());
app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin" }));
app.use(morgan("common"));
app.use(bodyParser.json({ limit: "50mb" })); // Increase limit
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors());
// Add file upload middleware
app.use(fileUpload({
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
  useTempFiles: false, // Don't use temp files
  abortOnLimit: true, // Return 413 if file size exceeds limit
  safeFileNames: true, // Remove special characters from file names
  preserveExtension: true // Preserve file extensions
}));

// Resolve the absolute path for Swagger API docs
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Swagger configuration
const swaggerOptions = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "TinyNotie API",
      version,
      description: "API documentation for TinyNotie",
    },
    servers: [
      {
        url: "http://localhost:9000",
        description: "Development server",
      },
      {
        url: "https://tinynotie-api.vercel.app/",
        description: "Production server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: [path.join(__dirname, "routes", "*.js")], // Use absolute path
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);

// Serve Swagger UI with custom CSS for Vercel compatibility
app.use("/api-docs", swaggerUi.serve);
app.get(
  "/api-docs",
  swaggerUi.setup(swaggerDocs, {
    customCssUrl:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui.min.css",
    customJs:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-bundle.js",
    customJsStandalonePreset:
      "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.1.0/swagger-ui-standalone-preset.js",
  })
);

/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 *   schemas:
 *     ErrorResponse:
 *       type: object
 *       properties:
 *         status:
 *           type: boolean
 *         message:
 *           type: string
 *         error:
 *           type: string
 * paths:
 *   /api-docs:
 *     get:
 *       summary: Swagger API documentation
 *       tags: [Documentation]
 *       responses:
 *         200:
 *           description: Swagger UI served successfully
 *         500:
 *           description: Internal server error
 */

/* ROUTES */
// app.use("/note", noteRoutes);
app.use("/openai", openAiRoutes);
app.use("/api", apiRoutes);
app.use("/auth", authRoutes);
app.use("/bot", telegrambotRoutes);
app.use("/daraboth", daraboth);

/* SERVER SETUP */
const PORT = process.env.PORT || 9000;
app.listen(PORT, () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
});

export default app;