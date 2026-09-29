// services/cronService.js — Automated Deadline & Interview Reminder Service

const cron = require('node-cron');
const nodemailer = require('nodemailer');
const JobApplication = require('../models/JobApplication');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;
  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

async function checkUpcomingReminders() {
  try {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Find applications with upcoming interviews or deadlines in next 24h that haven't sent reminders
    const upcoming = await JobApplication.find({
      reminderSent: false,
      $or: [
        {
          interviewDate: { $gte: now, $lte: next24Hours },
        },
        {
          deadlineDate: { $gte: now, $lte: next24Hours },
        },
      ],
    }).populate('user', 'name email');

    if (!upcoming || upcoming.length === 0) {
      return { count: 0, message: 'No pending reminders for the next 24 hours.' };
    }

    console.log(`[Reminder Service] Found ${upcoming.length} upcoming deadlines/interviews.`);

    const emailTransport = getTransporter();

    for (const app of upcoming) {
      const isInterview = app.interviewDate && app.interviewDate >= now && app.interviewDate <= next24Hours;
      const eventType = isInterview ? 'Upcoming Interview' : 'Application Deadline';
      const eventDate = isInterview ? app.interviewDate : app.deadlineDate;
      const formattedDate = new Date(eventDate).toLocaleString();

      console.log(`[Reminder Alert] ${eventType} for ${app.company} (${app.role}) scheduled at ${formattedDate}`);

      if (emailTransport && app.user && app.user.email) {
        try {
          await emailTransport.sendMail({
            from: process.env.EMAIL_FROM || '"JobTrack" <reminders@jobtrack.app>',
            to: app.user.email,
            subject: `⏰ Reminder: ${eventType} - ${app.company} (${app.role})`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 500px; padding: 20px; background: #0f172a; color: #f8fafc; border-radius: 8px;">
                <h2 style="color: #f59e0b;">JobTrack Reminder: ${eventType}</h2>
                <p>Hello ${app.user.name || 'there'},</p>
                <p>This is a reminder that you have an important event approaching:</p>
                <ul>
                  <li><strong>Company:</strong> ${app.company}</li>
                  <li><strong>Role:</strong> ${app.role}</li>
                  <li><strong>Event:</strong> ${eventType}</li>
                  <li><strong>Scheduled For:</strong> ${formattedDate}</li>
                  ${app.statusNote ? `<li><strong>Note:</strong> ${app.statusNote}</li>` : ''}
                </ul>
                <p>Best of luck with your preparation!</p>
              </div>
            `,
          });
          console.log(`[Reminder Email] Sent to ${app.user.email}`);
        } catch (mailErr) {
          console.error(`[Reminder Email Error] Failed to send email to ${app.user.email}:`, mailErr.message);
        }
      }

      app.reminderSent = true;
      await app.save();
    }

    return { count: upcoming.length, message: `Processed ${upcoming.length} reminders.` };
  } catch (err) {
    console.error('[Reminder Service Error]:', err.message);
    return { error: err.message };
  }
}

function startReminderCron() {
  // Run once every hour at minute 0
  cron.schedule('0 * * * *', async () => {
    console.log('[Reminder Cron] Running hourly reminder check...');
    await checkUpcomingReminders();
  });
  console.log('[Reminder Cron] Scheduled hourly background checker.');
}

module.exports = {
  startReminderCron,
  checkUpcomingReminders,
};
