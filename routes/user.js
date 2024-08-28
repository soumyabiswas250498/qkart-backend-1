var express = require("express");
var router = express.Router();
const { nanoid } = require("nanoid");
const { handleError, verifyAuth } = require("../utils");
var { users } = require("../db");
const fs = require('fs');
const path = require('path');

// Define path to the users database file
const usersDbPath = path.join(__dirname, '..', 'db', 'users.db');

// Check if the users database file exists
if (!fs.existsSync(usersDbPath)) {
  console.error(`Error: ${usersDbPath} does not exist.`);
}

router.get("/addresses", verifyAuth, (req, res) => {
  console.log(`GET request received to "/user/addresses"`);

  // Ensure the users database file exists before proceeding
  if (!fs.existsSync(usersDbPath)) {
    return res.status(500).json({ error: "Users database file is missing." });
  }

  return res.status(200).json(req.user.addresses);
});

router.post("/addresses", verifyAuth, (req, res) => {
  console.log(`POST request received to "/user/addresses"`);

  if (!fs.existsSync(usersDbPath)) {
    return res.status(500).json({ error: "Users database file is missing." });
  }

  if (req.body.address.length < 20) {
    return res.status(400).json({
      success: false,
      message: "Address should be greater than 20 characters",
    });
  }
  if (req.body.address.length > 128) {
    return res.status(400).json({
      success: false,
      message: "Address should be less than 128 characters",
    });
  }

  req.user.addresses.push({
    _id: nanoid(),
    address: req.body.address,
  });

  users.update(
    { _id: req.user._id },
    { $set: { addresses: req.user.addresses } },
    {},
    (err) => {
      if (err) {
        return handleError(res, err);
      }

      console.log(
        `Address "${req.body.address}" added to user ${req.user.username}'s address list`
      );

      return res.status(200).json(req.user.addresses);
    }
  );
});

router.delete("/addresses/:id", verifyAuth, async (req, res) => {
  console.log(`DELETE request received to "/user/addresses"`);

  if (!fs.existsSync(usersDbPath)) {
    return res.status(500).json({ error: "Users database file is missing." });
  }

  const index = await req.user.addresses.findIndex(
    (element) => element._id === req.params.id
  );
  if (index === -1) {
    return res.status(404).json({
      success: false,
      message: "Address to delete was not found",
    });
  }

  req.user.addresses.splice(index, 1);

  users.update(
    { _id: req.user._id },
    { $set: { addresses: req.user.addresses } },
    {},
    (err) => {
      if (err) {
        return handleError(res, err);
      }

      console.log(
        `Address with id ${req.params.id} deleted from user ${req.user.username}'s address list`
      );

      return res.status(200).json(req.user.addresses);
    }
  );
});

module.exports = router;
