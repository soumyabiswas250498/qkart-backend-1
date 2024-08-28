var express = require("express");
var router = express.Router();
const { handleError } = require("../utils");
var { users } = require("../db");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");
const config = require("../config.json");
const fs = require('fs');
const path = require('path');

// Define path to the users database file
const usersDbPath = path.join(__dirname, '..', 'db', 'users.db');

// Check if the users database file exists
if (!fs.existsSync(usersDbPath)) {
  console.error(`Error: ${usersDbPath} does not exist.`);
}

router.post("/register", (req, res) => {
  console.log(`POST request to "/auth/register" received`);

  // Ensure the users database file exists before proceeding
  if (!fs.existsSync(usersDbPath)) {
    return res.status(500).json({ error: "Users database file is missing." });
  }

  users.findOne({ username: req.body.username }, (err, user) => {
    if (err) {
      return handleError(res, err);
    }
    if (user) {
      return res.status(400).json({
        success: false,
        message: "Username already exists",
      });
    }

    users.insert({
      username: req.body.username,
      password: sha256(req.body.password),
      balance: 5000,
      cart: [],
      addresses: [],
    });

    console.log(`Registered user: ${req.body.username}`);

    return res.status(201).json({
      success: true,
    });
  });
});

router.post("/login", (req, res) => {
  console.log(`POST request to "/auth/login" received`);

  if (!fs.existsSync(usersDbPath)) {
    return res.status(500).json({ error: "Users database file is missing." });
  }

  users.findOne({ username: req.body.username }, (err, user) => {
    if (err) {
      return handleError(res, err);
    }
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Username does not exist",
      });
    }
    if (user.password !== sha256(req.body.password)) {
      return res.status(400).json({
        success: false,
        message: "Password is incorrect",
      });
    }
    const token = jwt.sign({ username: user.username }, config.jwtSecret, {
      expiresIn: "6h",
    });

    console.log(`Logged in as user: ${req.body.username}`);

    return res.status(201).json({
      success: true,
      token: token,
      username: user.username,
      balance: user.balance,
    });
  });
});

const sha256 = (input) =>
  crypto.createHash("sha256").update(input, "utf8").digest("hex");

module.exports = router;
