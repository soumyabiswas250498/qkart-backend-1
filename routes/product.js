var express = require("express");
var router = express.Router();
const { handleError, getProduct } = require("../utils");
var { products } = require("../db");
const fs = require('fs');
const path = require('path');

// Define paths to the database files
const usersDbPath = path.join(__dirname, '..', 'db', 'users.db');
const productsDbPath = path.join(__dirname, '..', 'db', 'products.db');

// Check if the database files exist
if (!fs.existsSync(usersDbPath)) {
  console.error(`Error: ${usersDbPath} does not exist.`);
}
if (!fs.existsSync(productsDbPath)) {
  console.error(`Error: ${productsDbPath} does not exist.`);
}

router.get("/", (req, res) => {
  console.log("Request received for retrieving products list");

  // Ensure the products database file exists before proceeding
  if (!fs.existsSync(productsDbPath)) {
    return res.status(500).json({ error: "Products database file is missing." });
  }

  products.find({}, (err, docs) => {
    if (err) {
      return handleError(res, err);
    }
    return res.status(200).json(docs);
  });
});

// /search?value=
router.get("/search", (req, res) => {
  console.log("Request received for searching ", req.query.value);

  if (!fs.existsSync(productsDbPath)) {
    return res.status(500).json({ error: "Products database file is missing." });
  }

  // Creating a RegEx to search
  const searchRegex = new RegExp(req.query.value.replace(/['"]+/g, ""), "i");

  products.find(
    { $or: [{ name: searchRegex }, { category: searchRegex }] },
    (err, docs) => {
      if (err) {
        return handleError(res, err);
      }

      if (docs.length) {
        return res.status(200).json(docs);
      } else {
        return res.status(404).json([]);
      }
    }
  );
});

router.get("/:id", async (req, res) => {
  console.log(`Request received for retrieving product with id: ${req.params.id}`);

  if (!fs.existsSync(productsDbPath)) {
    return res.status(500).json({ error: "Products database file is missing." });
  }

  try {
    const product = await getProduct(req.params.id);
    if (product) {
      return res.status(200).json(product);
    } else {
      return res.status(404).json();
    }
  } catch (error) {
    handleError(res, error);
  }
});

module.exports = router;
