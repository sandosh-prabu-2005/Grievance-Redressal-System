const express = require("express");
const router = express.Router();
const Grievance = require("../models/Grievance");
const auth = require("../middleware/auth");
const { isAdmin } = require("../middleware/roleCheck");
const createCsvWriter = require("csv-writer").createObjectCsvWriter;
const PDFDocument = require("pdfkit");

// Get all grievances with search and sorting
router.get("/", auth, async (req, res) => {
  try {
    let query = {};
    const { search, status, category, sortBy, sortOrder } = req.query;

    // Build query based on user role
    if (req.user.role === "student") {
      query.student = req.user.id;
    }

    // Add search filters
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) query.status = status;
    if (category) query.category = category;

    // Build sort options
    let sort = {};
    if (sortBy) {
      sort[sortBy] = sortOrder === "desc" ? -1 : 1;
    } else {
      sort.createdAt = -1; // Default sort by creation date
    }

    const grievances = await Grievance.find(query)
      .sort(sort)
      .populate("student", "name email");

    res.json(grievances);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Export grievances (admin only)
router.get("/export/:format", auth, isAdmin, async (req, res) => {
  try {
    const grievances = await Grievance.find()
      .populate("student", "name email")
      .sort({ createdAt: -1 });

    if (req.params.format === "csv") {
      const csvWriter = createCsvWriter({
        path: "grievances.csv",
        header: [
          { id: "title", title: "Title" },
          { id: "category", title: "Category" },
          { id: "status", title: "Status" },
          { id: "studentName", title: "Student Name" },
          { id: "studentEmail", title: "Student Email" },
          { id: "createdAt", title: "Created At" },
          { id: "adminResponse", title: "Admin Response" },
        ],
      });

      const records = grievances.map((g) => ({
        title: g.title,
        category: g.category,
        status: g.status,
        studentName: g.student.name,
        studentEmail: g.student.email,
        createdAt: g.createdAt,
        adminResponse: g.adminResponse || "",
      }));

      await csvWriter.writeRecords(records);
      res.download("grievances.csv");
    } else if (req.params.format === "pdf") {
      const doc = new PDFDocument();
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        "attachment; filename=grievances.pdf"
      );
      doc.pipe(res);

      doc.fontSize(16).text("Grievances Report", { align: "center" });
      doc.moveDown();

      grievances.forEach((g) => {
        doc.fontSize(12).text(`Title: ${g.title}`);
        doc
          .fontSize(10)
          .text(`Category: ${g.category}`)
          .text(`Status: ${g.status}`)
          .text(`Student: ${g.student.name} (${g.student.email})`)
          .text(`Created: ${new Date(g.createdAt).toLocaleString()}`)
          .text(`Admin Response: ${g.adminResponse || "No response yet"}`)
          .moveDown();
      });

      doc.end();
    }
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Create a new grievance (student only)
router.post("/", auth, async (req, res) => {
  if (req.user.role !== "student") {
    return res
      .status(403)
      .json({ message: "Only students can file grievances" });
  }
  const { title, description, category } = req.body;
  try {
    const newGrievance = new Grievance({
      student: req.user.id,
      title,
      description,
      category,
      status: "Pending",
      responseSubmitted: false,
    });
    await newGrievance.save();
    res.json(newGrievance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Get a grievance by ID
router.get("/:id", auth, async (req, res) => {
  try {
    const grievance = await Grievance.findById(req.params.id).populate(
      "student",
      "name email"
    );
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }
    // If student, ensure they own the grievance
    if (
      req.user.role === "student" &&
      grievance.student._id.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Access denied" });
    }
    res.json(grievance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

// Update grievance status and add admin response (admin only)
router.put("/:id", auth, isAdmin, async (req, res) => {
  const { status, adminResponse } = req.body;
  try {
    const grievance = await Grievance.findById(req.params.id);
    if (!grievance) {
      return res.status(404).json({ message: "Grievance not found" });
    }

    // Check if response was already submitted
    if (grievance.responseSubmitted && adminResponse) {
      return res
        .status(400)
        .json({ message: "Admin response has already been submitted" });
    }

    // Update fields
    if (status) grievance.status = status;
    if (adminResponse) {
      grievance.adminResponse = adminResponse;
      grievance.responseSubmitted = true;
    }

    await grievance.save();
    res.json(grievance);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server error");
  }
});

module.exports = router;
