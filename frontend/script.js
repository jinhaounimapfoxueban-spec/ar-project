// API基础URL - 部署后需要更新为Railway后端地址
const API_BASE_URL = window.location.hostname === 'localhost' ? 
    'http://localhost:5000' : 
    'https://your-backend.up.railway.app';

// 模拟数据存储（在没有后端时使用）
let projects = JSON.parse(localStorage.getItem('arProjects')) || [];
let currentOriginalImage = null;
let currentAIImage = null;

// DOM元素
const startCameraBtn = document.getElementById('start-camera');
const createProjectBtn = document.getElementById('create-project');
const helpBtn = document.getElementById('help-btn');
const cameraPreview = document.getElementById('camera-preview');
const projectsContainer = document.getElementById('projects-container');

// 初始化
document.addEventListener('DOMContentLoaded', function() {
    setupMobileControls();
    setupModal();
    setupCamera();
    renderProjects();
    checkDeviceAndEnvironment();
    
    // 检测移动设备
    if ('ontouchstart' in window || navigator.maxTouchPoints > 0) {
        document.body.classList.add('is-mobile');
    }
});

// 添加触摸事件支持
function setupMobileControls() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        // 防止移动端触摸时出现蓝色高亮
        button.style.webkitTapHighlightColor = 'transparent';
        
        // 触摸开始事件
        button.addEventListener('touchstart', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(0.95)';
            this.style.opacity = '0.8';
        });
        
        // 触摸结束事件
        button.addEventListener('touchend', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
            
            // 模拟点击事件
            this.click();
        });
        
        // 触摸取消事件（手指移出按钮）
        button.addEventListener('touchcancel', function(e) {
            e.preventDefault();
            this.style.transform = 'scale(1)';
            this.style.opacity = '1';
        });
    });
}

// 模态框控制功能
function setupModal() {
    const modal = document.getElementById('help-modal');
    const helpBtn = document.getElementById('help-btn');
    const closeBtn = document.querySelector('.close');
    
    if (helpBtn && modal && closeBtn) {
        // 打开模态框
        helpBtn.addEventListener('click', function() {
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden';
        });
        
        // 关闭模态框
        closeBtn.addEventListener('click', function() {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        });
        
        // 点击模态框背景关闭
        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
        
        // ESC键关闭
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && modal.style.display === 'block') {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        });
    }
}

// 相机控制功能
function setupCamera() {
    if (startCameraBtn && cameraPreview) {
        startCameraBtn.addEventListener('click', async function() {
            // 检查是否在Netlify预览环境
            if (window.location.hostname.includes('netlify.app')) {
                showNotification('📱 相机功能需要在真实移动设备上运行。请用手机访问此页面。', 'info');
                showQRCodeGuide();
                return;
            }
            
            // 检查是否支持相机
            if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                showNotification('您的浏览器不支持相机功能', 'error');
                return;
            }
            
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        facingMode: 'environment',
                        width: { ideal: 1280 },
                        height: { ideal: 720 }
                    }
                });
                
                cameraPreview.srcObject = stream;
                startCameraBtn.textContent = '相机已开启';
                startCameraBtn.disabled = true;
                
                // 隐藏引导提示
                const guide = document.querySelector('.camera-guide');
                if (guide) {
                    guide.style.display = 'none';
                }
                
            } catch (error) {
                console.error('无法访问相机:', error);
                handleCameraError(error);
            }
        });
    }
}

// 处理相机错误
function handleCameraError(error) {
    let message = '无法访问相机';
    
    if (error.name === 'NotAllowedError') {
        message = '相机权限被拒绝。请允许相机权限并刷新页面。';
    } else if (error.name === 'NotFoundError') {
        message = '未找到可用的相机设备';
    } else if (error.name === 'NotReadableError') {
        message = '相机设备正被其他程序使用';
    } else if (error.name === 'OverconstrainedError') {
        message = '无法满足相机配置要求';
    } else if (error.name === 'SecurityError') {
        message = '相机访问被浏览器安全策略阻止';
    } else if (error.name === 'TypeError') {
        message = '访问相机需要HTTPS协议';
    }
    
    showNotification(message, 'error');
}

// 设备检测和引导
function checkDeviceAndEnvironment() {
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isNetlifyPreview = window.location.hostname.includes('netlify.app');
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    const isHTTPS = window.location.protocol === 'https:';
    
    // 在Netlify预览环境显示提示
    if (isNetlifyPreview) {
        showNotification('📱 请用手机扫描二维码访问以获得完整功能', 'info');
        showQRCodeGuide();
    }
    
    // 非HTTPS环境提示
    if (!isHTTPS && !isLocalhost) {
        showNotification('⚠️ 相机功能需要HTTPS安全连接', 'error');
    }
    
    return { isMobile, isNetlifyPreview, isHTTPS };
}

// 显示二维码引导
function showQRCodeGuide() {
    // 移除现有的引导
    const existingGuide = document.querySelector('.qr-guide');
    if (existingGuide) {
        existingGuide.remove();
    }
    
    const guide = document.createElement('div');
    guide.className = 'qr-guide';
    guide.innerHTML = `
        <div style="text-align:center; padding:20px; background:rgba(0,0,0,0.8); border-radius:15px; margin:20px; color:white;">
            <h3>📱 手机访问指南</h3>
            <p>1. 用手机相机扫描下方二维码</p>
            <p>2. 在手机浏览器中打开</p>
            <p>3. 允许相机权限</p>
            <div id="qrcode" style="margin:15px auto; width:150px; height:150px; background:#fff; padding:10px; border-radius:10px;"></div>
            <p>或直接访问:<br><small>${window.location.href}</small></p>
        </div>
    `;
    
    const main = document.querySelector('main');
    if (main) {
        main.appendChild(guide);
    }
    
    // 简单模拟二维码
    const qrCode = document.getElementById('qrcode');
    if (qrCode) {
        qrCode.innerHTML = `
            <div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; font-size:40px; background:#fff;">
                📷
            </div>
        `;
    }
}

// 创建新项目功能
if (createProjectBtn) {
    createProjectBtn.addEventListener('click', function() {
        showNotification('创建项目功能需要后端支持', 'info');
    });
}

// 渲染项目列表
function renderProjects() {
    if (!projectsContainer) return;
    
    projectsContainer.innerHTML = '';
    
    if (projects.length === 0) {
        projectsContainer.innerHTML = `
            <div class="project-card">
                <h3>暂无项目</h3>
                <p>请创建您的第一个AR项目</p>
            </div>
        `;
        return;
    }
    
    projects.forEach(project => {
        const projectCard = document.createElement('div');
        projectCard.className = 'project-card';
        projectCard.innerHTML = `
            <h3>${project.name}</h3>
            <div class="project-image">
                <img src="${project.originalImage}" alt="${project.name}" style="max-width:100%; border-radius:8px;">
            </div>
            <p>创建时间: ${project.createdAt}</p>
            <p>状态: <span class="status">${project.status}</span></p>
            <div class="project-actions">
                <button class="view-btn" onclick="viewProject(${project.id})">
                    👁️ 查看项目
                </button>
            </div>
        `;
        projectsContainer.appendChild(projectCard);
    });
}

// 查看项目详情
window.viewProject = function(id) {
    const project = projects.find(p => p.id === id);
    if (project) {
        // 创建查看模态框
        const viewModal = document.createElement('div');
        viewModal.className = 'modal';
        viewModal.style.display = 'block';
        viewModal.innerHTML = `
            <div class="modal-content" style="max-width:90%; max-height:90vh; overflow-y:auto;">
                <span class="close">&times;</span>
                <h2>${project.name}</h2>
                <div style="text-align:center; margin:20px 0;">
                    <h3>原图</h3>
                    <img src="${project.originalImage}" alt="原图" style="max-width:100%; max-height:300px; border-radius:10px; margin-bottom:20px;">
                    <h3>AI增强图像</h3>
                    <img src="${project.aiImage}" alt="AI增强图像" style="max-width:100%; max-height:300px; border-radius:10px;">
                </div>
                <div style="text-align:center; margin-top:20px;">
                    <button class="close-btn" onclick="this.closest('.modal').style.display='none'" style="padding:10px 20px; background:#ff6b6b; color:white; border:none; border-radius:25px; cursor:pointer;">
                        关闭
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(viewModal);
        document.body.style.overflow = 'hidden';
        
        // 添加关闭事件
        const closeBtn = viewModal.querySelector('.close');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                viewModal.style.display = 'none';
                document.body.removeChild(viewModal);
                document.body.style.overflow = 'auto';
            });
        }
        
        viewModal.addEventListener('click', (e) => {
            if (e.target === viewModal) {
                viewModal.style.display = 'none';
                document.body.removeChild(viewModal);
                document.body.style.overflow = 'auto';
            }
        });
    }
};

// 显示通知
function showNotification(message, type = 'success') {
    // 移除现有的通知
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()" style="background:none; border:none; color:inherit; cursor:pointer; margin-left:10px;">×</button>
    `;
    
    // 添加样式
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: space-between;
        min-width: 250px;
        max-width: 350px;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(45deg, #4ecdc4, #44a08d)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(45deg, #ff6b6b, #ee5a24)';
    } else if (type === 'info') {
        notification.style.background = 'linear-gradient(45deg, #4e54c8, #8f94fb)';
    }
    
    document.body.appendChild(notification);
    
    // 自动消失
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 4000);
}

// 添加CSS动画
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .notification {
        animation: slideIn 0.3s ease;
    }
    
    .status {
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 12px;
        font-weight: bold;
        background: rgba(255,255,255,0.2);
    }
    
    .view-btn {
        background: linear-gradient(45deg, #4ecdc4, #44a08d);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        font-size: 14px;
        transition: all 0.3s ease;
    }
    
    .view-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
    }
    
    .close-btn {
        background: linear-gradient(45deg, #ff6b6b, #ee5a24);
        color: white;
        border: none;
        padding: 12px 24px;
        border-radius: 25px;
        cursor: pointer;
        font-weight: 600;
        transition: all 0.3s ease;
    }
    
    .close-btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    }
    
    /* 相机引导提示 */
    .camera-guide {
        text-align: center;
        padding: 20px;
        background: rgba(255, 255, 255, 0.1);
        border-radius: 15px;
        margin: 15px 0;
        backdrop-filter: blur(10px);
    }

    .guide-icon {
        font-size: 3rem;
        margin-bottom: 10px;
    }

    .guide-text {
        font-size: 1.2rem;
        font-weight: 600;
        margin-bottom: 5px;
    }

    .guide-subtext {
        font-size: 0.9rem;
        opacity: 0.8;
    }

    /* 二维码引导 */
    .qr-guide {
        margin: 20px auto;
        max-width: 400px;
    }

    /* 移动端隐藏引导 */
    @media (max-width: 768px) {
        .camera-guide {
            display: none;
        }
    }
`;
document.head.appendChild(style);

// 全局错误处理
window.addEventListener('error', function(e) {
    console.error('全局错误:', e.error);
    showNotification('发生了一些错误，请刷新页面重试', 'error');
});

// 离线检测
window.addEventListener('online', function() {
    showNotification('网络连接已恢复');
});

window.addEventListener('offline', function() {
    showNotification('网络连接已断开，使用本地模式', 'error');
});

// 导出函数供全局使用
window.showNotification = showNotification;
window.viewProject = viewProject;
