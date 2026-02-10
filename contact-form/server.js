const express = require('express');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Form route
app.post('/contact', async (req, res) => {
  const { Name, Company, E_mail, Phone, Message } = req.body;

  // Simple validation
  if (!Name || !E_mail || !Message) {
    return res.status(400).json({ error: 'Please fill all required fields.' });
  }

  if (!validateEmail(E_mail)) {
    return res.status(400).json({ error: 'Invalid email address.' });
  }

  // Nodemailer transport
  let transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'info@webfusionexperts.com', // Your Gmail
      pass: 'zbnv nfqd wmfu imph' // Gmail App Password
    }
  });

  // Email options
  let mailOptions = {
    from: `"Website Contact" <info@webfusionexperts.com>`,
    to: 'info@webfusionexperts.com',
    subject: '🚀 New Contact Form Submission',
    html: `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;font-family:Arial,Helvetica,sans-serif;">
      <tr>
        <td align="center">
          <table width="1100" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.08);">
            
            <!-- Header -->
            <tr>
              <td style="background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);padding:25px;text-align:center;">
                <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px;">
                  📩 New Contact Form Submission
                </h1>
              </td>
            </tr>
  
            <!-- Body -->
            <tr>
              <td style="padding:30px;">
                <table width="100%" cellpadding="0" cellspacing="0">
                  
                  <tr>
                    <td style="padding:12px 0;font-weight:bold;color:#555;width:140px;">👤 Name</td>
                    <td style="padding:12px 0;color:#111;">${Name}</td>
                  </tr>
  
                  <tr>
                    <td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td>
                  </tr>
  
                  <tr>
                    <td style="padding:12px 0;font-weight:bold;color:#555;">🏢 Company</td>
                    <td style="padding:12px 0;color:#111;">${Company || '-'}</td>
                  </tr>
  
                  <tr>
                    <td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td>
                  </tr>
  
                  <tr>
                    <td style="padding:12px 0;font-weight:bold;color:#555;">📧 Email</td>
                    <td style="padding:12px 0;">
                      <a href="mailto:${E_mail}" style="color:#1a73e8;text-decoration:none;">
                        ${E_mail}
                      </a>
                    </td>
                  </tr>
  
                  <tr>
                    <td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td>
                  </tr>
  
                  <tr>
                    <td style="padding:12px 0;font-weight:bold;color:#555;">📞 Phone</td>
                    <td style="padding:12px 0;color:#111;">${Phone || '-'}</td>
                  </tr>
  
                  <tr>
                    <td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td>
                  </tr>
  
                  <tr>
                    <td style="padding:12px 0;font-weight:bold;color:#555;vertical-align:top;">💬 Message</td>
                    <td style="padding:12px 0;color:#333;line-height:1.6;">
                      ${Message}
                    </td>
                  </tr>
  
                </table>
              </td>
            </tr>
  
            <!-- Footer -->
            <tr>
              <td style="background:#f1f3f4;padding:18px;text-align:center;">
                <p style="margin:0;font-size:13px;color:#666;">
                  This message was sent from your website contact form.
                </p>
                <p style="margin:6px 0 0;font-size:12px;color:#999;">
                  © ${new Date().getFullYear()} WebFusion Experts
                </p>
              </td>
            </tr>
  
          </table>
        </td>
      </tr>
    </table>
    `
  };
  
  

  try {
    await transporter.sendMail(mailOptions);
    res.json({ message: 'Message sent successfully!' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Something went wrong. Please try again later.' });
  }
});

// Email validation function
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
