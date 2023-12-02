const express = require("express");
const router = express.Router();
const pricesController = require("../controllers/pricesController");

router.get("/get", async (req, res) => {
    try {
        let data = await pricesController.getPrices(req.query);
        res.send (
            data
        );
    } catch (err) {
        console.log(err);
        res.send ({success: false});
    }
});

module.exports = router;