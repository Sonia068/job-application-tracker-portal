// controllers/applicationController.js — Full CRUD, Pagination, Attachments & Alerts

const fs = require('fs');
const path = require('path');
const JobApplication = require('../models/JobApplication');

// ── @GET /api/applications ────────────────────────────────────
// Supports: ?page=1&limit=10&stage=Applied&search=google&sort=-createdAt&priority=true
const getApplications = async (req, res) => {
  try {
    const { stage, search, sort, priority, source, page = 1, limit } = req.query;
    const filter = { user: req.user._id };

    if (stage && stage !== 'All') filter.stage = stage;
    if (source && source !== 'All') filter.source = source;
    if (priority === 'true') filter.priority = true;

    if (search) {
      filter.$or = [
        { company: { $regex: search, $options: 'i' } },
        { role:    { $regex: search, $options: 'i' } },
        { location: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOption = sort || '-createdAt';
    const total = await JobApplication.countDocuments(filter);

    let query = JobApplication.find(filter).sort(sortOption);

    const isAll = limit === 'all';
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = isAll ? 0 : Math.max(1, parseInt(limit, 10) || 10);

    if (limitNum > 0) {
      const skip = (pageNum - 1) * limitNum;
      query = query.skip(skip).limit(limitNum);
    }

    const applications = await query.lean();
    const totalPages = limitNum > 0 ? Math.ceil(total / limitNum) || 1 : 1;

    res.json({
      success: true,
      count: applications.length,
      total,
      page: pageNum,
      totalPages,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
      data: applications,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @GET /api/applications/alerts/upcoming ────────────────────
const getUpcomingAlerts = async (req, res) => {
  try {
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcoming = await JobApplication.find({
      user: req.user._id,
      $or: [
        { interviewDate: { $gte: now, $lte: next7Days } },
        { deadlineDate: { $gte: now, $lte: next7Days } },
      ],
    })
      .sort('interviewDate deadlineDate')
      .lean();

    res.json({ success: true, count: upcoming.length, data: upcoming });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @GET /api/applications/:id ────────────────────────────────
const getApplication = async (req, res) => {
  try {
    const app = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
    if (!app) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @POST /api/applications ───────────────────────────────────
const createApplication = async (req, res) => {
  try {
    const {
      company, role, location, jobUrl, source, salaryNote,
      stage, statusNote, appliedDate, interviewDate, deadlineDate,
      notes, tags, priority,
    } = req.body;

    if (!company || !role) {
      return res.status(400).json({ success: false, message: 'Company and role are required' });
    }

    const application = await JobApplication.create({
      user: req.user._id,
      company, role, location, jobUrl, source, salaryNote,
      stage: stage || 'Saved',
      statusNote, appliedDate, interviewDate, deadlineDate,
      notes, tags, priority,
    });

    res.status(201).json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @PUT /api/applications/:id ────────────────────────────────
const updateApplication = async (req, res) => {
  try {
    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @DELETE /api/applications/:id ────────────────────────────
const deleteApplication = async (req, res) => {
  try {
    const application = await JobApplication.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });

    // Clean up attached file if present
    if (application.resume?.filePath && fs.existsSync(application.resume.filePath)) {
      try {
        fs.unlinkSync(application.resume.filePath);
      } catch (e) {
        console.error('Failed to delete file from disk:', e.message);
      }
    }

    res.json({ success: true, message: 'Application deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @PATCH /api/applications/:id/stage ───────────────────────
const updateStage = async (req, res) => {
  try {
    const { stage, statusNote } = req.body;
    const application = await JobApplication.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { stage, ...(statusNote !== undefined && { statusNote }) },
      { new: true, runValidators: true }
    );
    if (!application) return res.status(404).json({ success: false, message: 'Application not found' });
    res.json({ success: true, data: application });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @POST /api/applications/:id/resume ────────────────────────
const uploadResume = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a valid file' });
    }

    const app = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    // Remove old file if it exists
    if (app.resume?.filePath && fs.existsSync(app.resume.filePath)) {
      try {
        fs.unlinkSync(app.resume.filePath);
      } catch (err) {
        console.error('Failed to remove older resume file:', err.message);
      }
    }

    app.resume = {
      fileName: req.file.originalname,
      filePath: req.file.path,
      fileUrl: `/uploads/${req.file.filename}`,
      fileSize: req.file.size,
      uploadedAt: new Date(),
    };

    await app.save();

    res.json({ success: true, message: 'Resume uploaded successfully', data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── @DELETE /api/applications/:id/resume ──────────────────────
const deleteResume = async (req, res) => {
  try {
    const app = await JobApplication.findOne({ _id: req.params.id, user: req.user._id });
    if (!app) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    if (app.resume?.filePath && fs.existsSync(app.resume.filePath)) {
      try {
        fs.unlinkSync(app.resume.filePath);
      } catch (err) {
        console.error('Failed to delete file from disk:', err.message);
      }
    }

    app.resume = {
      fileName: '',
      filePath: '',
      fileUrl: '',
      fileSize: 0,
      uploadedAt: null,
    };

    await app.save();

    res.json({ success: true, message: 'Resume removed successfully', data: app });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getApplications,
  getApplication,
  createApplication,
  updateApplication,
  deleteApplication,
  updateStage,
  uploadResume,
  deleteResume,
  getUpcomingAlerts,
};