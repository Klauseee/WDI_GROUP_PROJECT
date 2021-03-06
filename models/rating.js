const mongoose = require('mongoose');

const ratingSchema = new mongoose.Schema(
  {
    createdBy: { type: mongoose.Schema.ObjectId, ref: 'User', required: true },
    pace: { type: Number, required: true },
    concepts: { type: Number, required: true },
    syntax: { type: Number, required: true },
    confidence: { type: Number, required: true },
    message: String
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Rating', ratingSchema);
