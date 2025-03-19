import express from "express";
import userRoutes from "./userRoutes.js";
import groupRoutes from "./groupRoutes.js";
import tripRoutes from "./tripRoutes.js";
import chatRoutes from "./chatRoutes.js";
import miscRoutes from "./miscRoutes.js";

const router = express.Router();

// Use the separated route files
router.use(userRoutes);
router.use(groupRoutes);
router.use(tripRoutes);
router.use(chatRoutes);
router.use(miscRoutes);

export default router;
