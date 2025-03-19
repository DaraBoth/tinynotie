import express from "express" 
import dotenv from "dotenv"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import bodyParser from "body-parser"
import authRoutes from "./routes/auth.js"
import apiRoutes from "./routes/api.js"
import openAiRoutes from "./routes/openai.js";
import telegrambotRoutes from "./routes/telegrambot.js";
import daraboth from "./routes/daraboth.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";

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
 
// Swagger configuration
const swaggerOptions = {
  swaggerDefinition: {
    openapi: "3.0.0",
    info: {
      title: "TinyNotie API",
      version: "1.0.0",
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
  apis: ["./routes/*.js"], // Path to the API docs
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocs));

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