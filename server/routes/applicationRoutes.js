// routes/applicationRoutes.js
const express = require('express');
const router = express.Router();
const {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  updateStage,
  uploadResume,
  deleteResume,
  getUpcomingAlerts,
} = require('../controllers/applicationController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.use(protect); // All routes require auth

// Alerts endpoint (declared before :id)
router.get('/alerts/upcoming', getUpcomingAlerts);

router.route('/')
  .get(getApplications)
  .post(createApplication);

router.route('/:id')
  .get(getApplication)
  .put(updateApplication)
  .delete(deleteApplication);

router.patch('/:id/stage', updateStage);

// Resume upload & delete
router.post('/:id/resume', upload.single('resume'), uploadResume);
router.delete('/:id/resume', deleteResume);

module.exports = router;