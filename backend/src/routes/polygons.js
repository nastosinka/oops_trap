const express = require("express");
const fs = require("fs");
const path = require("path");

const router = express.Router();

router.get("/:mapName", (req, res) => {
  const { mapName } = req.params;

  const mapPath = path.join(__dirname, "../../data", `${mapName}.json`);

  fs.readFile(mapPath, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({
        error: "Ошибка чтения файла карты",
        details: err.message,
        mapPathUsed: mapPath, 
      });
    }
    try {
      const json = JSON.parse(data);
      res.json(json);
    } catch (parseErr) {
      res.status(500).json({
        error: "Ошибка парсинга JSON карты",
        details: parseErr.message,
        mapPathUsed: mapPath,
      });
    }
  });
});

module.exports = router;
