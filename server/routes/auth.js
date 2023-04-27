const express = require('express');
const axios = require('axios');
const router = express.Router();

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    res.status(200).json({ response });
  } catch (error) {
    console.error("error", error);
    res.status(500).json({ error: error.message });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { username, password } = req.body;

    res.status(200).json({ response });
  } catch (error) {
    console.error("error", error.message);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
