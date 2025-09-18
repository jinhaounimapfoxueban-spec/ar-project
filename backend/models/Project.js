const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    maxlength: 500
  },
  originalImage: {
    type: String,
    required: true
  },
  aiImage: {
    type: String,
    default: ''
  },
  video: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['draft', 'processing', 'completed', 'archived'],
    default: 'draft'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  metadata: {
    imageFormat: String,
    fileSize: Number,
    dimensions: {
      width: Number,
      height: Number
    },
    processingTime: Number
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// 更新时自动设置updatedAt
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// 创建索引以便更快查询
projectSchema.index({ createdBy: 1, createdAt: -1 });
projectSchema.index({ status: 1 });
projectSchema.index({ isPublic: 1 });

module.exports = mongoose.model('Project', projectSchema);
