const express = require('express');
const { authenticateToken } = require('../middleware/auth');
const Project = require('../models/Project');

const router = express.Router();

// 获取所有项目（需要认证）
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const filter = { createdBy: req.user._id };
    
    if (req.query.status) {
      filter.status = req.query.status;
    }
    
    if (req.query.search) {
      filter.name = { $regex: req.query.search, $options: 'i' };
    }

    const projects = await Project.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const total = await Project.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    res.json({
      success: true,
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('获取项目错误:', error);
    res.status(500).json({ 
      success: false,
      error: '获取项目失败' 
    });
  }
});

// 获取单个项目
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: '项目不存在或没有访问权限' 
      });
    }

    res.json({ 
      success: true,
      project 
    });
  } catch (error) {
    console.error('获取项目错误:', error);
    res.status(500).json({ 
      success: false,
      error: '获取项目失败' 
    });
  }
});

// 创建新项目
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { name, description, originalImage, aiImage, tags, metadata } = req.body;
    
    if (!name || !originalImage) {
      return res.status(400).json({ 
        success: false,
        error: '项目名称和原图是必需的' 
      });
    }

    const project = new Project({
      name,
      description,
      originalImage,
      aiImage: aiImage || '',
      tags: tags || [],
      metadata: metadata || {},
      createdBy: req.user._id,
      status: 'draft'
    });

    await project.save();

    res.status(201).json({
      success: true,
      message: '项目创建成功',
      project
    });
  } catch (error) {
    console.error('创建项目错误:', error);
    res.status(500).json({ 
      success: false,
      error: '创建项目失败' 
    });
  }
});

// 更新项目
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { name, description, aiImage, video, status, tags, metadata } = req.body;
    
    const project = await Project.findOneAndUpdate(
      { 
        _id: req.params.id, 
        createdBy: req.user._id 
      },
      { 
        name,
        description,
        aiImage,
        video,
        status,
        tags,
        metadata,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    );

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: '项目不存在或没有修改权限' 
      });
    }

    res.json({
      success: true,
      message: '项目更新成功',
      project
    });
  } catch (error) {
    console.error('更新项目错误:', error);
    res.status(500).json({ 
      success: false,
      error: '更新项目失败' 
    });
  }
});

// 删除项目
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      createdBy: req.user._id
    });

    if (!project) {
      return res.status(404).json({ 
        success: false,
        error: '项目不存在或没有删除权限' 
      });
    }

    res.json({
      success: true,
      message: '项目删除成功'
    });
  } catch (error) {
    console.error('删除项目错误:', error);
    res.status(500).json({ 
      success: false,
      error: '删除项目失败' 
    });
  }
});

module.exports = router;
