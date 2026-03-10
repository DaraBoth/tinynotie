import dotenv from "dotenv"
dotenv.config();

import express from "express"
import cors from "cors"
import helmet from "helmet"
import morgan from "morgan"
import bodyParser from "body-parser"
import fileUpload from "express-fileupload"
import authRoutes from "./routes/auth.js"
import apiRoutes from "./routes/api.js"
import openAiRoutes from "./routes/openai.js";
import telegrambotRoutes from "./routes/telegrambot.js";
import { initTelegramBot, setupWebhook } from "./services/telegramBotService.js";

// Initialize Telegram Bot for webhook mode (no polling)
const bot = initTelegramBot(process.env.TELEGRAM_BOT_TOKEN_NEW);

// Setup webhook if running on Vercel or with webhook URL configured
const setupWebhookOnStart = async () => {
  if (process.env.TELEGRAM_WEBHOOK_URL) {
    try {
      await setupWebhook(process.env.TELEGRAM_WEBHOOK_URL);
      console.log('[Telegram] Webhook configured:', process.env.TELEGRAM_WEBHOOK_URL);
    } catch (err) {
      console.error('[Telegram] Failed to setup webhook:', err.message);
    }
  }
};

import daraboth from "./routes/daraboth.js";
import swaggerUi from "swagger-ui-express";
import swaggerJsDoc from "swagger-jsdoc";
import path from "path";
import { fileURLToPath } from "url";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const { version } = require("./package.json");
const swaggerUiDistPath = require("swagger-ui-dist").absolutePath();

const app = express();

/* CONFIGURATIONS */
// dotenv.config() already called at top for bot initialization
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

// Health endpoint for Fly.io checks
app.get('/healthz', (_, res) => {
  res.status(200).json({ status: 'ok' });
});

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
      {
        url: "https://tinynotie.fly.dev",
        description: "Fly.io server",
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
  apis: [
    path.join(__dirname, "routes", "*.js"),
    path.join(__dirname, "routes", "**", "*.js"),
    path.join(__dirname, "index.js"),
  ],
};

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

const normalizePath = (rawPath = "") => {
  if (!rawPath || rawPath === "/") return "/";
  const replacedParams = rawPath.replace(/:([A-Za-z0-9_]+)/g, "{$1}");
  const cleaned = replacedParams.replace(/\/+/g, "/");
  return cleaned.startsWith("/") ? cleaned : `/${cleaned}`;
};

const extractMountPath = (regexp) => {
  if (!regexp || !regexp.source) return "";
  const source = regexp.source;
  if (source === "^\\/?$") return "";

  return source
    .replace("^\\/", "/")
    .replace("\\/?(?=\\/|$)", "")
    .replace("(?=\\/|$)", "")
    .replace(/\\\//g, "/")
    .replace(/\$$/, "")
    .replace(/^\^/, "")
    .replace(/\(\?:\(\[\^\\\/\]\+\?\)\)/g, ":param")
    .replace(/\(\?:\(\?=\.\)\[\^\\\/\]\+\?\)/g, ":param")
    .replace(/\/\?/g, "")
    .replace(/\/$/, "");
};

const collectExpressRoutes = (stack, prefix = "") => {
  const routes = [];

  stack.forEach((layer) => {
    if (layer.route?.path) {
      const routePath = normalizePath(`${prefix}${layer.route.path}`);
      Object.keys(layer.route.methods || {})
        .filter((method) => layer.route.methods[method])
        .forEach((method) => {
          routes.push({ method: method.toLowerCase(), path: routePath });
        });
      return;
    }

    if (layer.name === "router" && layer.handle?.stack) {
      const mountPath = normalizePath(extractMountPath(layer.regexp) || "");
      const nextPrefix = normalizePath(`${prefix}${mountPath}`);
      routes.push(...collectExpressRoutes(layer.handle.stack, nextPrefix === "/" ? "" : nextPrefix));
    }
  });

  return routes;
};

const guessTag = (routePath) => {
  const first = routePath.split("/").filter(Boolean)[0] || "General";
  return first.charAt(0).toUpperCase() + first.slice(1);
};

const buildSwaggerDocs = () => {
  const docs = swaggerJsDoc(swaggerOptions);
  docs.paths = docs.paths || {};

  const stack = app?._router?.stack || [];
  const discoveredRoutes = collectExpressRoutes(stack);

  discoveredRoutes.forEach(({ method, path: routePath }) => {
    if (!docs.paths[routePath]) docs.paths[routePath] = {};
    if (!docs.paths[routePath][method]) {
      docs.paths[routePath][method] = {
        tags: [guessTag(routePath)],
        summary: `${method.toUpperCase()} ${routePath}`,
        responses: {
          200: { description: "Success" },
          400: { description: "Bad request" },
          500: { description: "Internal server error" },
        },
      };
    }
  });

  return docs;
};

const swaggerDocs = buildSwaggerDocs();

// Explicit static serving for swagger-ui-dist assets (bundle/preset/css) on serverless.
app.use("/api-docs", express.static(swaggerUiDistPath, { index: false }));

// Serve Swagger UI and its static assets from the same origin.
// This avoids CSP blocking of CDN scripts/styles and prevents 404 MIME issues on deployment.
app.use(
  "/api-docs",
  swaggerUi.serveFiles(swaggerDocs),
  swaggerUi.setup(swaggerDocs, {
    explorer: true,
    swaggerOptions: {
      url: "/api-docs.json",
    },
  })
);

app.get('/api-docs.json', (_, res) => {
  res.json(swaggerDocs);
});

/* SERVER SETUP */
const PORT = process.env.PORT || 9000;
const server = app.listen(PORT, async () => {
  console.log(`Example app listening at http://localhost:${PORT}`);
  
  // Setup Telegram webhook on startup
  await setupWebhookOnStart();
});

export default app;