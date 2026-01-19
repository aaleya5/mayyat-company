const express = require("express");
const router = express.Router();
const db = require("../db");

// POST /add-death
router.post("/add-death", async (req, res) => {
  const {
    name,
    gender,
    age,
    dafan_date,
    father_name,
    address,
    mobile,
    remarks
  } = req.body;

  try {
    const result = await db.query(
      `INSERT INTO deaths 
        (name, gender, age, dafan_date, father_name, address, mobile, remarks)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *`,
      [name, gender, age, dafan_date, father_name, address, mobile, remarks]
    );

    res.status(201).json({
      message: "Death record added successfully",
      data: result.rows[0]
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error adding death record" });
  }
});

module.exports = router;