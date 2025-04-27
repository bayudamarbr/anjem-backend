const express = require('express');
const { getUsers, updateUser } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .get(protect, authorize('admin'), getUsers);

router.route('/:id')
  .put(protect, updateUser);

module.exports = router;