import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import connectDB from "./config/db.js";
import Contact from "./models/Contact.js";
import Subscription from "./models/Subscription.js";
import cors from "cors";

dotenv.config();
connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ===============================
// MIDDLEWARE
// ===============================

app.use(cors({ origin: "*" }));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

// ===============================
// EMAIL TRANSPORTER
// ===============================

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// verify transporter
transporter.verify((error) => {
  if (error) {
    console.log("❌ Email config error:", error);
  } else {
    console.log("✅ Email server ready");
  }
});

// ===============================
// CONTACT FORM API
// ===============================

app.post("/api/contact", async (req, res) => {

  try {

    // Honeypot spam protection
    if (req.body.website) {
      return res.status(400).json({
        error: "Spam detected"
      });
    }

    const {
      Name,
      Company,
      E_mail,
      Phone,
      Message,
      Service,
      OtherService
    } = req.body;

    if (!Name || !E_mail || !Phone || !Message || !Service) {
      return res.status(400).json({
        error: "All required fields are mandatory"
      });
    }

    // ===============================
    // VALIDATION
    // ===============================

    const phoneRegex = /^\d{10}$/;
    const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;
    const nameRegex = /^[A-Za-z\s]{2,50}$/;

    if (!nameRegex.test(Name)) {
      return res.status(400).json({ error: "Invalid name" });
    }

    if (!phoneRegex.test(Phone)) {
      return res.status(400).json({
        error: "Phone must be 10 digits"
      });
    }

    if (!emailRegex.test(E_mail)) {
      return res.status(400).json({
        error: "Invalid email address"
      });
    }

    if (Message.length < 10) {
      return res.status(400).json({
        error: "Message must be at least 10 characters"
      });
    }

    const validServices = [
      "Website Development",
      "CRM System",
      "Custom Software Development",
      "Mobile Applications Development",
      "Other"
    ];

    if (!validServices.includes(Service)) {
      return res.status(400).json({
        error: "Invalid service selected"
      });
    }

    if (Service === "Other" && (!OtherService || OtherService.trim() === "")) {
      return res.status(400).json({
        error: "Please specify the other service"
      });
    }

    const serviceText = OtherService
      ? `${Service} (${OtherService})`
      : Service;

    // ===============================
    // EMAIL TEMPLATE
    // ===============================

    const mailOptions = {
      from: `"Website Contact" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      replyTo: E_mail,
      subject: "🚀 New Contact Form Submission",
      html: `
        <h2>New Contact Message</h2>

        <p><b>Name:</b> ${Name}</p>
        <p><b>Company:</b> ${Company || "Not specified"}</p>
        <p><b>Email:</b> ${E_mail}</p>
        <p><b>Phone:</b> ${Phone}</p>
        <p><b>Service:</b> ${serviceText}</p>

        <p><b>Message:</b></p>
        <p>${Message}</p>
      `
    };

    // ===============================
    // SEND EMAIL
    // ===============================

    await transporter.sendMail(mailOptions);

    // ===============================
    // SAVE TO DATABASE
    // ===============================

    await Contact.create({
      name: Name,
      company: Company || "Not specified",
      email: E_mail,
      phone: Phone,
      service: Service,
      otherService: OtherService || "",
      message: Message
    });

    return res.status(200).json({
      success: true,
      message: "Message sent successfully"
    });

    console.log("Contact request:", req.body);

  } catch (error) {

    console.error("❌ Contact API error:", error);

    return res.status(500).json({
      error: "Failed to send email. Please try again later."
    });

  }

});

// ===============================
// SUBSCRIBE API
// ===============================

app.post("/api/subscribe", async (req, res) => {

  try {

    const { email } = req.body;

    if (!email || !email.trim()) {
      return res.status(400).json({
        error: "Email required"
      });
    }

    const emailRegex = /^[\w.-]+@[\w.-]+\.[a-zA-Z]{2,}$/;

    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Invalid email address"
      });
    }

    const existing = await Subscription.findOne({
      email: email.toLowerCase()
    });

    if (existing && existing.status === "active") {
      return res.status(400).json({
        error: "Already subscribed"
      });
    }

    if (existing) {

      existing.status = "active";
      existing.subscribedAt = new Date();

      await existing.save();

    } else {

      await Subscription.create({
        email: email.toLowerCase()
      });

    }

    res.json({
      success: true,
      message: "Subscribed successfully"
    });

  } catch (error) {

    console.error("❌ Subscription error:", error);

    res.status(500).json({
      error: "Subscription failed"
    });

  }

});

// ===============================
// PAGE ROUTING
// ===============================

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "views/dashboard.html"));
});

app.use("/api", (req, res) => {
  res.status(404).json({
    error: "API endpoint not found"
  });
});

app.get("/*", (req, res) => {

  const requestedPath = req.path;

  const hasFileExtension = /\.[a-zA-Z0-9]{2,4}$/.test(requestedPath);

  // agar kisi file ko directly request kiya gaya ho
  if (hasFileExtension) {
    return res.status(404).send("Resource not found");
  }

  const validPages = [
    "dashboard",
    "contact",
    "projects",
    "case-study",
    "about-company",
    "our-services",
    "meet-the-team"
  ];

  const cleanPath = requestedPath.replace("/", "");

  // homepage
  if (cleanPath === "") {
    return res.sendFile(path.join(__dirname, "views", "dashboard.html"));
  }

  // valid pages
  if (validPages.includes(cleanPath)) {

    const htmlPath = path.join(__dirname, "views", `${cleanPath}.html`);

    if (fs.existsSync(htmlPath)) {
      return res.sendFile(htmlPath);
    }

  }

  // fallback 404
  const errorPage = path.join(__dirname, "views", "404.html");

  if (fs.existsSync(errorPage)) {
    return res.status(404).sendFile(errorPage);
  }

  res.status(404).send("Page not found");

});

// ===============================
// START SERVER
// ===============================

app.listen(PORT, () => {

  console.log("🚀 Server running");
  console.log(`🌐 http://localhost:${PORT}`);

});