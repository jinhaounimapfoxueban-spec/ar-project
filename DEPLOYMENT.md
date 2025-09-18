# 部署指南

## 1. MongoDB Atlas 设置
1. 注册 MongoDB Atlas 账户
2. 创建免费集群 (M0)
3. 获取连接字符串
4. 设置网络访问 (0.0.0.0/0)

## 2. Railway 后端部署
1. 访问 https://railway.app
2. 连接 GitHub 仓库
3. 部署 backend 文件夹
4. 设置环境变量：
   - MONGODB_URI
   - JWT_SECRET
   - PORT=3000

## 3. Netlify 前端部署
1. 访问 https://netlify.com
2. 拖拽 frontend 文件夹部署
3. 或连接 GitHub 仓库自动部署

## 环境变量
后端需要以下环境变量：
- MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
- JWT_SECRET=your-super-secret-key-here
- PORT=3000
