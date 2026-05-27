const express = require("express");
const router  = express.Router();
const { protect } = require("../middleware/auth.middleware");
const { getMe, deleteMe } = require("../controllers/user.controller");

router.get("/me",    ...protect, getMe);
router.delete("/me", ...protect, deleteMe);

module.exports = router;