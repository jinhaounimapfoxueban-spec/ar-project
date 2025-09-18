// API基础URL - 部署后需要更新为Railway后端地址
const API_BASE_URL = 'https://your-backend.up.railway.app';

// 模拟数据存储（在没有后端时使用）
let projects = JSON.parse(localStorage.getItem('arProjects')) || [];
let currentOriginalImage = null;
let currentAIImage = null;

// DOM元素
const loginBtn = document.getElementById('loginBtn');
const loginModal = document.getElementById('loginModal');
const adminPanel = document.getElementById('adminPanel');
const createProjectBtn = document.getElementById('createProjectBtn');
const createProjectModal = document.getElementById('createProjectModal');
const helpModal = document.getElementById('helpModal');
const helpBtn = document.getElementById('helpBtn');
const closeModalButtons = document.querySelectorAll('.close-modal');
const submitLogin = document.getElementById('submitLogin');
const projectsGrid = document.getElementById('projectsGrid');
const startCameraBtn = document.getElementById('startCameraBtn');
const projectImage = document.getElementById('projectImage');
const imagePreview = document.getElementById('imagePreview');
const regenerateImageBtn = document.getElementById('regenerateImageBtn');
const generateVideoBtn = document.getElementById('generateVideoBtn');
const regenerateVideoBtn = document.getElementById('regenerateVideoBtn');
const saveProjectBtn = document.getElementById('saveProjectBtn');
const videoPreview = document.getElementById('videoPreview');

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    renderProjects();
    checkLoginStatus();
});

// 检查登录状态
function checkLoginStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        adminPanel.style.display = 'block';
    }
}

// 显示通知
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// 打开登录模态框
loginBtn.addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

// 打开帮助模态框
helpBtn.addEventListener('click', () => {
    helpModal.style.display = 'flex';
});

// 关闭模态框
closeModalButtons.forEach(button => {
    button.addEventListener('click', () => {
        loginModal.style.display = 'none';
        createProjectModal.style.display = 'none';
        helpModal.style.display = 'none';
    });
});

// 点击模态框外部关闭
window.addEventListener('click', (e) => {
    if (e.target === loginModal) loginModal.style.display = 'none';
    if (e.target === createProjectModal) createProjectModal.style.display = 'none';
    if (e.target === helpModal) helpModal.style.display = 'none';
});

// 提交登录
submitLogin.addEventListener('click', async () => {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    
    if (!username || !password) {
        showNotification('请输入用户名和密码', 'error');
        return;
    }
    
    try {
        // 尝试使用后端API登录
        const success = await login(username, password);
        if (success) {
            showNotification('登入成功！');
            loginModal.style.display = 'none';
            adminPanel.style.display = 'block';
            loadProjectsFromAPI();
        } else {
            // 后端失败时使用模拟登录
            simulateLogin(username, password);
        }
    } catch (error) {
        // 网络错误时使用模拟登录
        simulateLogin(username, password);
    }
});

// 实际API登录
async function login(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });
        
        if (!response.ok) return false;
        
        const data = await response.json();
        if (data.success && data.token) {
            localStorage.setItem('authToken', data.token);
            return true;
        }
        return false;
    } catch (error) {
        console.error('API登录错误:', error);
        return false;
    }
}

// 模拟登录（后端不可用时使用）
function simulateLogin(username, password) {
    if (username === 'admin2025' && password === 'Tjh244466666') {
        showNotification('登入成功！（模拟模式）');
        loginModal.style.display = 'none';
        adminPanel.style.display = 'block';
    } else {
        showNotification('用户名或密码错误！', 'error');
    }
}

// 从API加载项目
async function loadProjectsFromAPI() {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        if (response.ok) {
            const data = await response.json();
            if (data.success) {
                projects = data.projects;
                renderProjects();
            }
        }
    } catch (error) {
        console.error('加载项目错误:', error);
        // 失败时使用本地存储的项目
        projects = JSON.parse(localStorage.getItem('arProjects')) || [];
    }
}

// 打开创建项目模态框
createProjectBtn.addEventListener('click', () => {
    createProjectModal.style.display = 'flex';
    // 重置表单
    document.getElementById('projectName').value = '';
    imagePreview.innerHTML = '<p>图片预览区域</p>';
    videoPreview.innerHTML = '<p>视频预览区域</p>';
    currentOriginalImage = null;
    currentAIImage = null;
});

// 开启相机
startCameraBtn.addEventListener('click', () => {
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        navigator.mediaDevices.getUserMedia({ video: true })
            .then(function(stream) {
                const cameraFrame = document.querySelector('.camera-frame');
                cameraFrame.innerHTML = '';
                
                const video = document.createElement('video');
                video.srcObject = stream;
                video.autoplay = true;
                video.playsInline = true;
                
                cameraFrame.appendChild(video);
                startCameraBtn.textContent = '关闭相机';
                startCameraBtn.onclick = () => {
                    stream.getTracks().forEach(track => track.stop());
                    resetCameraView();
                };
            })
            .catch(function(error) {
                showNotification('无法访问相机: ' + error.message, 'error');
            });
    } else {
        showNotification('您的浏览器不支持相机功能', 'error');
    }
});

function resetCameraView() {
    const cameraFrame = document.querySelector('.camera-frame');
    cameraFrame.innerHTML = '<div class="camera-placeholder"><i class="fas fa-camera"></i></div><div class="scan-line"></div>';
    startCameraBtn.textContent = '开启相机';
    startCameraBtn.onclick = () => {
        document.getElementById('startCameraBtn').click();
    };
}

// 图片上传预览
projectImage.addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(event) {
            currentOriginalImage = event.target.result;
            imagePreview.innerHTML = `<img src="${currentOriginalImage}" alt="上传的图片" style="max-width:100%; max-height:100%;">`;
            
            // 模拟AI图像生成
            setTimeout(() => {
                generateAIImage(currentOriginalImage);
            }, 1000);
        };
        reader.readAsDataURL(file);
    }
});

// 生成AI图像（模拟）
function generateAIImage(originalImage) {
    // 创建画布处理图像
    const img = new Image();
    img.src = originalImage;
    img.onload = function() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        // 绘制原图
        ctx.drawImage(img, 0, 0);
        
        // 应用一些滤镜模拟AI增强效果
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            // 增加对比度
            data[i] = data[i] < 128 ? data[i] * 0.9 : Math.min(data[i] * 1.1, 255);
            data[i + 1] = data[i + 1] < 128 ? data[i + 1] * 0.9 : Math.min(data[i + 1] * 1.1, 255);
            data[i + 2] = data[i + 2] < 128 ? data[i + 2] * 0.9 : Math.min(data[i + 2] * 1.1, 255);
        }
        
        ctx.putImageData(imageData, 0, 0);
        
        // 获取处理后的图像数据
        currentAIImage = canvas.toDataURL('image/jpeg');
        
        // 显示AI图像
        imagePreview.innerHTML = `
            <img src="${currentOriginalImage}" alt="原图" style="position:absolute; max-width:100%; max-height:100%; opacity:1;">
            <img src="${currentAIImage}" alt="AI增强图像" class="ai-image" style="position:absolute; max-width:100%; max-height:100%; opacity:0;">
        `;
        
        // 应用渐变效果
        setTimeout(() => {
            const aiImage = imagePreview.querySelector('.ai-image');
            aiImage.style.transition = 'opacity 2s ease-in-out';
            aiImage.style.opacity = '1';
        }, 500);
    };
}

// 重新生成AI图像
regenerateImageBtn.addEventListener('click', () => {
    if (currentOriginalImage) {
        showNotification('AI图像重新生成中...');
        generateAIImage(currentOriginalImage);
    } else {
        showNotification('请先上传原图', 'error');
    }
});

// 生成视频
generateVideoBtn.addEventListener('click', () => {
    if (!currentOriginalImage || !currentAIImage) {
        showNotification('请先上传原图并生成AI图像', 'error');
        return;
    }
    
    showNotification('视频生成中...');
    
    // 创建视频预览
    videoPreview.innerHTML = `
        <div style="position:relative; width:100%; height:100%; display:flex; justify-content:center; align-items:center;">
            <img src="${currentOriginalImage}" alt="原图" style="position:absolute; max-width:90%; max-height:90%;" id="videoOriginalImage">
            <img src="${currentAIImage}" alt="AI图像" style="position:absolute; max-width:90%; max-height:90%; opacity:0;" id="videoAIImage">
        </div>
        <p>从原图到AI图像的渐变过程</p>
    `;
    
    // 开始渐变效果
    setTimeout(() => {
        const videoAIImage = document.getElementById('videoAIImage');
        videoAIImage.style.transition = 'opacity 3s ease-in-out';
        videoAIImage.style.opacity = '1';
    }, 500);
});

// 重新生成视频
regenerateVideoBtn.addEventListener('click', () => {
    if (!currentOriginalImage || !currentAIImage) {
        showNotification('请先上传原图并生成AI图像', 'error');
        return;
    }
    
    showNotification('视频重新生成中...');
    generateVideoBtn.click();
});

// 保存项目
saveProjectBtn.addEventListener('click', async () => {
    const projectName = document.getElementById('projectName').value;
    if (!projectName) {
        showNotification('请输入项目名称', 'error');
        return;
    }
    
    if (!currentOriginalImage || !currentAIImage) {
        showNotification('请先上传原图并生成AI图像和视频', 'error');
        return;
    }
    
    const newProject = {
        id: Date.now(),
        name: projectName,
        originalImage: currentOriginalImage,
        aiImage: currentAIImage,
        createdAt: new Date().toLocaleDateString('zh-CN'),
        status: '已发布'
    };
    
    try {
        // 尝试保存到API
        const success = await saveProjectToAPI(newProject);
        if (!success) {
            // API失败时保存到本地存储
            projects.push(newProject);
            localStorage.setItem('arProjects', JSON.stringify(projects));
        }
        
        showNotification('项目保存成功！');
        createProjectModal.style.display = 'none';
        renderProjects();
    } catch (error) {
        // 保存到本地存储
        projects.push(newProject);
        localStorage.setItem('arProjects', JSON.stringify(projects));
        showNotification('项目保存成功！（本地模式）');
        createProjectModal.style.display = 'none';
        renderProjects();
    }
});

// 保存项目到API
async function saveProjectToAPI(project) {
    try {
        const token = localStorage.getItem('authToken');
        const response = await fetch(`${API_BASE_URL}/api/projects`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(project)
        });
        
        return response.ok;
    } catch (error) {
        console.error('保存项目到API错误:', error);
        return false;
    }
}

// 渲染项目列表
function renderProjects() {
    projectsGrid.innerHTML = '';
    
    if (projects.length === 0) {
        projectsGrid.innerHTML = '<p>暂无项目，请创建新项目</p>';
        return;
    }
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <h3>${project.name}</h3>
            <div class="project-image">
                <img src="${project.originalImage}" alt="${project.name}" style="max-width:100%; max-height:100%;">
            </div>
            <p>创建于: ${project.createdAt}</p>
            <p>状态: ${project.status}</p>
            <div class="project-actions">
                <button class="btn btn-secondary" onclick="editProject(${project.id})">
                    <i class="fas fa-edit"></i> 编辑
                </button>
                <button class="btn btn-primary" onclick="viewProject(${project.id})">
                    <i class="fas fa-eye"></i> 查看
                </button>
            </div>
        `;
        projectsGrid.appendChild(projectCard);
    });
}

// 编辑项目
window.editProject = function(id) {
    const project = projects.find(p => p.id === id);
    if (project) {
        showNotification(`编辑项目 #${id}（实际部署时会打开编辑界面）`);
    }
};

// 查看项目
window.viewProject = function(id) {
    const project = projects.find(p => p.id === id);
    if (project) {
        // 创建查看模态框
        const viewModal = document.createElement('div');
        viewModal.className = 'modal';
        viewModal.style.display = 'flex';
        viewModal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2>${project.name}</h2>
                    <span class="close-modal">&times;</span>
                </div>
                <div style="text-align:center;">
                    <h3>原图</h3>
                    <img src="${project.originalImage}" alt="原图" style="max-width:100%; max-height:300px; margin-bottom:20px;">
                    <h3>AI增强图像</h3>
                    <img src="${project.aiImage}" alt="AI增强图像" style="max-width:100%; max-height:300px;">
                </div>
                <div style="margin-top:20px; text-align:center;">
                    <button class="btn btn-primary" onclick="this.closest('.modal').style.display='none'">
                        <i class="fas fa-times"></i> 关闭
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(viewModal);
        
        // 添加关闭事件
        viewModal.querySelector('.close-modal').addEventListener('click', () => {
            viewModal.style.display = 'none';
            document.body.removeChild(viewModal);
        });
        
        viewModal.addEventListener('click', (e) => {
            if (e.target === viewModal) {
                viewModal.style.display = 'none';
                document.body.removeChild(viewModal);
            }
        });
    }
};

// 全局错误处理
window.addEventListener('error', (e) => {
    console.error('全局错误:', e.error);
});

// 离线检测
window.addEventListener('online', () => {
    showNotification('网络连接已恢复');
});

window.addEventListener('offline', () => {
    showNotification('网络连接已断开，使用本地模式', 'error');
});
