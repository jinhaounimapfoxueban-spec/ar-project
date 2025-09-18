const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// 初始化管理员用户
const initializeAdmin = async () => {
  try {
    const existingAdmin = await User.findOne({ username: 'admin2025' });
    if (!existingAdmin) {
      const adminUser = new User({
        username: 'admin2025',
        password: 'Tjh244466666',
        role: 'admin'
      });
      await adminUser.save();
      console.log('管理员用户已创建');
    }
  } catch (error) {
    console.error('初始化管理员用户错误:', error);
  }
};

// 调用初始化
initializeAdmin();

// 登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证输入
    if (!username || !password) {
      return res.status(400).json({ 
        success: false,
        error: '用户名和密码是必需的' 
      });
    }

    // 查找用户
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ 
        success: false,
        error: '用户不存在' 
      });
    }
    
    if (!user.isActive) {
      return res.status(400).json({ 
        success: false,
        error: '用户账户已被禁用' 
      });
    }

    // 验证密码
    const validPassword = await user.comparePassword(password);
    if (!validPassword) {
      return res.status(400).json({ 
        success: false,
        error: '密码错误' 
      });
    }
    
    // 更新最后登录时间
    user.lastLogin = new Date();
    await user.save();

    // 生成JWT令牌
    const token = jwt.sign(
      { 
        userId: user._id,
        username: user.username,
        role: user.role
      }, 
      process.env.JWT_SECRET || 'fallback-secret', 
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true,
      message: '登录成功',
      token,
      user: {
        id: user._id,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
    res.status(500).json({ 
      success: false,
      error: '服务器错误，请稍后重试' 
    });
  }
});

// 验证令牌
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ 
        success: false,
        error: '令牌是必需的' 
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback-secret');
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user || !user.isActive) {
      return res.status(401).json({ 
        success: false,
        error: '令牌无效' 
      });
    }

    res.json({ 
      success: true,
      user,
      valid: true
    });
  } catch (error) {
    res.status(401).json({ 
      success: false,
      error: '令牌无效',
      valid: false
    });
  }
});

module.exports = router;
