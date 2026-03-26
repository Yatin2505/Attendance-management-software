const nodemailer = require('nodemailer');

// Configure transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// @desc Send attendance notification
const sendAttendanceNotification = async (req, res) => {
  try {
    const { email, name, message } = req.body;
    // Simple notification - expand later
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Tecno Skill Attendance Update',
      html: `<h2>Hi ${name}</h2><p>${message}</p>`
    };

    await transporter.sendMail(mailOptions);
    res.status(200).json({ message: 'Notification sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { sendAttendanceNotification };
