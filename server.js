import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import open from "open";
import chokidar from "chokidar";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Livereload setup
let clients = [];

app.use('/livereload', (req, res) => {
  res.writeHead(200, {
    'Connection': 'keep-alive',
    'Content-Type': 'text/plain',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  });

  clients.push(res);

  req.on('close', () => {
    clients = clients.filter(client => client !== res);
  });
});

// Watch for file changes and notify clients
chokidar.watch(['*.html', 'js/**/*.js', 'css/**/*.css'], {
  ignored: /(^|[\/\\])\../, // ignore dotfiles
  persistent: true
}).on('change', (path) => {
  console.log(`File changed: ${path}, reloading...`);
  clients.forEach(client => {
    client.write('reload\n');
  });
});

// Middleware to inject livereload script into HTML files
app.use((req, res, next) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    const originalSend = res.send;
    res.send = function(body) {
      if (typeof body === 'string' && body.includes('</body>')) {
        const livereloadScript = `
          <script>
            const es = new EventSource('/livereload');
            es.onmessage = function(event) {
              if (event.data === 'reload') {
                console.log('File changed, reloading page...');
                window.location.reload();
              }
            };
            es.onerror = function(event) {
              console.log('Livereload disconnected');
            };
          </script>
        `;
        body = body.replace('</body>', `${livereloadScript}</body>`);
      }
      originalSend.call(this, body);
    };
  }
  next();
});

// Serve static files
app.use(express.static(__dirname));

// API routes
app.use("/api", express.json());

// Add CORS headers for API routes
app.use("/api", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Contact form endpoint
app.post("/api/contact", async (req, res) => {
  try {
    const { Name, Company, E_mail, Phone, Message } = req.body;

    // Validation
    if (!Name || !E_mail || !Message) {
      return res.status(400).json({ error: "Please fill all required fields." });
    }

    // Enhanced email validation
    if (!validateEmail(E_mail)) {
      return res.status(400).json({ error: "Please enter a valid email address." });
    }
    
    // Custom email domain validation
    if (!E_mail.includes('@gmail.com') && !E_mail.includes('@webfusionexperts.in')) {
      return res.status(400).json({ 
        error: "Please use @gmail.com or @webfusionexperts.in email address." 
      });
    }

    // Phone validation (if provided)
    if (Phone && !/^\d{10}$/.test(Phone)) {
      return res.status(400).json({ 
        error: "Phone number must be exactly 10 digits." 
      });
    }

    // Nodemailer transport
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email template
    const mailOptions = {
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: "🚀 New Contact Form Submission",
      html: `
      <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f8;padding:30px 0;font-family:Arial,Helvetica,sans-serif;">
        <tr>
          <td align="center">
            <table width="1100" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 8px 25px rgba(0,0,0,0.08);">
              
              <tr>
                <td style="background:linear-gradient(135deg,#0f2027,#203a43,#2c5364);padding:25px;text-align:center;">
                  <h1 style="color:#ffffff;margin:0;font-size:22px;letter-spacing:0.5px;">
                   📩 Contact Form Submission
                  </h1>
                </td>
              </tr>

              <tr>
                <td style="padding:30px;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    
                    <tr>
                      <td style="padding:12px 0;font-weight:bold;color:#555;width:140px;">👤 Name</td>
                      <td style="padding:12px 0;color:#111;">${Name}</td>
                    </tr>

                    <tr><td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td></tr>

                    <tr>
                      <td style="padding:12px 0;font-weight:bold;color:#555;">🏢 Company</td>
                      <td style="padding:12px 0;color:#111;">${Company || "-"}</td>
                    </tr>

                    <tr><td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td></tr>

                    <tr>
                      <td style="padding:12px 0;font-weight:bold;color:#555;">📧 Email</td>
                      <td style="padding:12px 0;">
                        <a href="mailto:${E_mail}" style="color:#1a73e8;text-decoration:none;">
                          ${E_mail}
                        </a>
                      </td>
                    </tr>

                    <tr><td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td></tr>

                    <tr>
                      <td style="padding:12px 0;font-weight:bold;color:#555;">📞 Phone</td>
                      <td style="padding:12px 0;color:#111;">${Phone || "-"}</td>
                    </tr>

                    <tr><td colspan="2"><hr style="border:none;border-top:1px solid #eee;"></td></tr>

                    <tr>
                      <td style="padding:12px 0;font-weight:bold;color:#555;vertical-align:top;">💬 Message</td>
                      <td style="padding:12px 0;color:#333;line-height:1.6;">
                        ${Message}
                      </td>
                    </tr>

                  </table>
                </td>
              </tr>

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
      `,
    };

    // Send email asynchronously to not block the response
    transporter.sendMail(mailOptions).catch(console.error);
    
    // Send immediate response to client
    return res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    // Send simplified error response
    return res.status(500).json({ 
      error: "Something went wrong. Please try again later."
    });
  }
});

// Email validation function
function validateEmail(email) {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
}

// Serve index.html for root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "dashboard.html"));
});

// Serve other HTML files
app.get("/*.html", (req, res) => {
  res.sendFile(path.join(__dirname, req.url));
});

// Handle server startup with proper error handling
const server = app.listen(PORT, async () => {
  console.log('\x1b[36m%s\x1b[0m', '🚀 Portfolio Website is starting...');
  console.log('\x1b[33m%s\x1b[0m', `📁 Serving static files from: ${__dirname}`);
  console.log('\x1b[35m%s\x1b[0m', `📝 Contact API: POST /api/contact`);
  console.log('\x1b[32m%s\x1b[0m', `✅ Server running on: http://localhost:${PORT}`);
  
  // Automatically open the browser
  try {
    console.log('\x1b[34m%s\x1b[0m', `🌐 Opening browser automatically...`);
    await open(`http://localhost:${PORT}`);
    console.log('\x1b[32m%s\x1b[0m', `🎉 Browser opened successfully!`);
  } catch (err) {
    console.log('\x1b[31m%s\x1b[0m', `❌ Could not open browser automatically: ${err.message}`);
    console.log('\x1b[33m%s\x1b[0m', `🔗 Please manually visit: http://localhost:${PORT}`);
  }
});

// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('\x1b[31m%s\x1b[0m', `❌ Port ${PORT} is already in use. Please close the other application or use a different port.`);
  } else {
    console.log('\x1b[31m%s\x1b[0m', `❌ Server error: ${err.message}`);
  }
  process.exit(1);
});