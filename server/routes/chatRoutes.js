import express from "express";
import { authenticateToken } from "./middleware/auth.js";
import { pool, handleError } from "../utils/db.js";

const router = express.Router();

/**
 * @swagger
 * /chats/chatRoom:
 *   post:
 *     summary: Create a new chat room
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               user1_id:
 *                 type: integer
 *               user2_id:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Chat room created successfully
 *       500:
 *         description: Internal server error
 */
router.post("/chatRoom", authenticateToken, async (req, res) => {
  const { user1_id, user2_id } = req.body;

  try {
    const sql = `
      INSERT INTO chat_room (user1_id, user2_id)
      VALUES ($1, $2)
      RETURNING id, user1_id, user2_id, created_at;
    `;
    const result = await pool.query(sql, [user1_id, user2_id]);
    res.json({ status: true, data: result.rows[0] });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /chats/chatRooms:
 *   get:
 *     summary: Get all chat rooms for a user
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of chat rooms retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   user1_id:
 *                     type: integer
 *                   user2_id:
 *                     type: integer
 *                   created_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
// Get all chat rooms for a user
router.get("/chatRooms", authenticateToken, async (req, res) => {
  const { _id: user_id } = req.user;

  try {
    const sql = `
      SELECT id, user1_id, user2_id, created_at
      FROM chat_room
      WHERE user1_id = $1 OR user2_id = $1;
    `;
    const result = await pool.query(sql, [user_id]);
    res.json({ status: true, data: result.rows });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /chats/chatRoom/{id}:
 *   delete:
 *     summary: Delete a chat room
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room to delete
 *     responses:
 *       200:
 *         description: Chat room deleted successfully
 *       500:
 *         description: Internal server error
 */
// Delete a chat room
router.delete("/chatRoom/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `DELETE FROM chat_room WHERE id = $1;`;
    await pool.query(sql, [id]);
    res.json({ status: true, message: "Chat room deleted successfully." });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /chats/chatMessage:
 *   post:
 *     summary: Create a new chat message
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chat_room_id:
 *                 type: integer
 *               sender_id:
 *                 type: integer
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Chat message created successfully
 *       500:
 *         description: Internal server error
 */
// Create a new chat message
router.post("/chatMessage", authenticateToken, async (req, res) => {
  const { chat_room_id, sender_id, message } = req.body;

  try {
    const sql = `
      INSERT INTO chat_message (chat_room_id, sender_id, message)
      VALUES ($1, $2, $3)
      RETURNING id, chat_room_id, sender_id, message, sent_at;
    `;
    const result = await pool.query(sql, [chat_room_id, sender_id, message]);
    res.json({ status: true, data: result.rows[0] });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /chats/chatMessages/{chat_room_id}:
 *   get:
 *     summary: Get all messages for a chat room
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: chat_room_id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat room
 *     responses:
 *       200:
 *         description: List of chat messages retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   chat_room_id:
 *                     type: integer
 *                   sender_id:
 *                     type: integer
 *                   message:
 *                     type: string
 *                   sent_at:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */
// Get all messages for a chat room
router.get("/chatMessages/:chat_room_id", authenticateToken, async (req, res) => {
  const { chat_room_id } = req.params;

  try {
    const sql = `
      SELECT id, chat_room_id, sender_id, message, sent_at
      FROM chat_message
      WHERE chat_room_id = $1
      ORDER BY sent_at ASC;
    `;
    const result = await pool.query(sql, [chat_room_id]);
    res.json({ status: true, data: result.rows });
  } catch (error) {
    handleError(error, res);
  }
});

/**
 * @swagger
 * /chats/chatMessage/{id}:
 *   delete:
 *     summary: Delete a chat message
 *     tags: [Chats]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the chat message to delete
 *     responses:
 *       200:
 *         description: Chat message deleted successfully
 *       500:
 *         description: Internal server error
 */
// Delete a chat message
router.delete("/chatMessage/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const sql = `DELETE FROM chat_message WHERE id = $1;`;
    await pool.query(sql, [id]);
    res.json({ status: true, message: "Chat message deleted successfully." });
  } catch (error) {
    handleError(error, res);
  }
});

export default router;