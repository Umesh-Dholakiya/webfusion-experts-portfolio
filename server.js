import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import open from "open";
import nodemailer from "nodemailer";
import connectDB from "./config/db.js";
import Contact from "./models/Contact.js";
import Subscription from "./models/Subscription.js";


const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config();

// Connect to MongoDB
connectDB();

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


// Middleware to inject livereload script into HTML files
app.use((req, res, next) => {
  if (req.headers.accept && req.headers.accept.includes('text/html')) {
    const originalSend = res.send;
    res.send = function (body) {
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
  const { Name, Company, E_mail, Phone, Message, Service, OtherService } = req.body;

  // Check required fields
  if (!Name || !E_mail || !Phone || !Message || !Service) {
    return res.status(400).json({ error: "All required fields are mandatory" });
  }

  // Regex patterns
  const phoneRegex = /^\d{10}$/;
  const emailRegex = /^[a-zA-Z0-9._%+-]+@(gmail\.com|webfusionexperts\.in)$/;
  const nameRegex = /^[A-Za-z\s]{2,50}$/;

  // Validate Name
  if (!nameRegex.test(Name)) {
    return res.status(400).json({ error: "Invalid name. Only letters and spaces allowed (2-50 characters)" });
  }

  // Validate Phone - exactly 10 digits
  if (!phoneRegex.test(Phone)) {
    return res.status(400).json({ error: "Phone number must be exactly 10 digits" });
  }

  // Validate Email
  if (!emailRegex.test(E_mail)) {
    return res.status(400).json({ error: "Please use a valid @gmail.com or @webfusionexperts.in email" });
  }

  // Validate Message length
  if (Message.length < 10) {
    return res.status(400).json({ error: "Message must be at least 10 characters" });
  }

  // Validate Service selection
  const validServices = ["Website Development", "CRM System", "Custom Software Development", "Mobile Applications Development", "Other"];
  if (!validServices.includes(Service)) {
    return res.status(400).json({ error: "Please select a valid service" });
  }

  // If "Other" is selected, validate it's not empty
  if (Service === "Other" && (!OtherService || OtherService.trim().length === 0)) {
    return res.status(400).json({ error: "Please specify the other service" });
  }

  // Create email transporter
  let transporter;
  try {
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  } catch (error) {
    console.error('Email transporter error:', error);
    return res.status(500).json({ error: "Email service configuration failed" });
  }

  // Prepare email content
  const serviceText = OtherService ? `${Service} (${OtherService})` : Service;
  
const mailOptions = {
  from: `"Website Contact" <${process.env.EMAIL_USER}>`,
  to: process.env.EMAIL_USER,
  replyTo: E_mail,
  subject: `🚀 New Contact Form Submission`,
  html: `
  <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:30px 15px;">
    
    <div style="max-width:650px; margin:0 auto; background:#ffffff; border-radius:10px; overflow:hidden; box-shadow:0 5px 20px rgba(0,0,0,0.08);">
      
      <!-- Header -->
      <div style="background:linear-gradient(90deg,#0f2027,#203a43,#2c5364); padding:25px; text-align:center;">
        <h2 style="color:#ffffff; margin:0; font-size:22px; letter-spacing:0.5px;">
          📩 Contact Form Submission
        </h2>
      </div>

      <!-- Body -->
      <div style="padding:25px 30px;">

        ${createRow("👤 Name", Name)}
        ${createRow("🏢 Company", Company || "Not specified")}
        ${createRow("📧 Email", `<a href="mailto:${E_mail}" style="color:#007bff; text-decoration:none;">${E_mail}</a>`)}
        ${createRow("📞 Phone", `<a href="tel:+91${Phone}" style="color:#333; text-decoration:none;">+91 ${Phone}</a>`)}
        ${createRow("🛠 Service", serviceText || "Not selected")}
        ${createRow("💬 Message", Message)}

      </div>

      <!-- Footer -->
      <div style="background:#f4f6f8; padding:18px; text-align:center; font-size:13px; color:#777;">
        <p style="margin:0;">
          This message was sent from your website contact form.
        </p>
        <p style="margin:5px 0 0 0;">
          © 2026 WebFusion Experts
        </p>
      </div>

    </div>
  </div>
  `
};

// Helper function for rows
function createRow(label, value) {
  return `
    <div style="padding:14px 0; border-bottom:1px solid #eaeaea; display:flex;">
      <div style="width:140px; font-weight:bold; color:#555;">${label}</div>
      <div style="flex:1; color:#333;">${value}</div>
    </div>
  `;
}

  // Send email
  try {
    await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${process.env.EMAIL_USER} from ${Name}`);
    
    // Save to MongoDB
    const newContact = await Contact.create({
      name: Name,
      company: Company || 'Not specified',
      email: E_mail,
      phone: Phone,
      service: Service,
      otherService: OtherService || '',
      message: Message
    });
    
    console.log(`💾 Contact saved to MongoDB: ${newContact._id}`);
    res.status(200).json({ success: true, message: "Message received successfully" });
  } catch (error) {
    console.error('❌ Email sending failed:', error);
    console.error('Error details:', error.message);
    res.status(500).json({ error: "Failed to send email. Please try again later." });
  }
});

// Subscription form endpoint
app.post("/api/subscribe", async (req, res) => {
  const { email } = req.body;

  // Validate email
  if (!email || !email.trim()) {
    return res.status(400).json({ error: "Email is required" });
  }

  const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: "Please enter a valid email address" });
  }

  try {
    // Check if already subscribed
    const existingSubscription = await Subscription.findOne({ email: email.toLowerCase() });
    
    if (existingSubscription) {
      if (existingSubscription.status === 'active') {
        return res.status(400).json({ error: "You are already subscribed!" });
      } else {
        // Reactivate subscription
        existingSubscription.status = 'active';
        existingSubscription.subscribedAt = new Date();
        await existingSubscription.save();
        console.log(`📧 Subscription reactivated: ${email}`);
      }
    } else {
      // Create new subscription
      await Subscription.create({ email: email.toLowerCase() });
      console.log(`📧 New subscription saved: ${email}`);
    }

    res.status(200).json({ success: true, message: "Successfully subscribed!" });
  } catch (error) {
    console.error('❌ Subscription error:', error);
    res.status(500).json({ error: "Failed to subscribe. Please try again later." });
  }
});

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
  console.log('\x1b[32m%s\x1b[0m', `✅ Server running on: http://localhost:${PORT}`);
  
  // Automatically open browser after server starts
  try {
    await open(`http://localhost:${PORT}`);
    console.log('\x1b[33m%s\x1b[0m', `🌐 Browser opened: http://localhost:${PORT}`);
  } catch (error) {
    console.log('\x1b[33m%s\x1b[0m', `⚠️  Could not auto-open browser. Please open manually: http://localhost:${PORT}`);
  }
});

app.use(express.json({ limit: "10kb" }));


// Handle server errors
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.log('\x1b[31m%s\x1b[0m', `❌ Port ${PORT} is already in use. Please close the other application or use a different port.`);
  } else {
    console.log('\x1b[31m%s\x1b[0m', `❌ Server error: ${err.message}`);
  }
  process.exit(1);
});