const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/database');

// 加载环境变量
dotenv.config();

// 连接数据库
connectDB();

const app = express();

// 中间件
app.use(cors());
app.use(express.json());

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/projects', require('./routes/projects'));

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: '服务器内部错误' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`服务器运行在端口 ${PORT}`);
});
