const mongoose = require("mongoose");

const GrievanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Academic",
        "Infrastructure",
        "Hostel",
        "Transportation",
        "Others",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["Pending", "In Review", "Accepted", "Rejected", "Resolved"],
      default: "Pending",
    },
    adminResponse: { type: String },
    responseSubmitted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Add text index for search functionality
GrievanceSchema.index({ title: "text", description: "text" });

module.exports = mongoose.model("Grievance", GrievanceSchema);
