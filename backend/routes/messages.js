const express = require('express');
const router = express.Router();
const Grievance = require('../models/Grievance');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get messages for a grievance
router.get('/:grievanceId', auth, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.grievanceId);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }
    // Only admin or the grievance owner can view messages
    if (req.user.role === 'student' && grievance.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const messages = await Message.find({ grievance: req.params.grievanceId })
      .populate('sender', 'name role');
    res.json(messages);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// Send a message in a grievance thread
router.post('/', auth, async (req, res) => {
  const { grievanceId, content } = req.body;
  try {
    const grievance = await Grievance.findById(grievanceId);
    if (!grievance) {
      return res.status(404).json({ message: 'Grievance not found' });
    }
    // Only admin or the grievance owner can send messages
    if (req.user.role === 'student' && grievance.student.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }
    const message = new Message({
      grievance: grievanceId,
      sender: req.user.id,
      content
    });
    await message.save();
    res.json(message);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
