// API基础URL - 使用相对路径以便于部署
const API_BASE_URL = '/api';

// 性能优化工具函数
// 防抖函数
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// 节流函数
function throttle(func, limit) {
  let inThrottle;
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
}

// 默认导航数据
const DEFAULT_LINKS = [
    {
        id: '1',
        name: 'GitHub',
        url: 'https://github.com',
        category: 'main',
        icon: 'G'
    },
    {
        id: '2',
        name: 'Google',
        url: 'https://google.com',
        category: 'main',
        icon: 'G'
    },
    {
        id: '3',
        name: 'MDN Web Docs',
        url: 'https://developer.mozilla.org',
        category: 'main',
        icon: 'MDN'
    }
];

// DOM元素引用
const elements = {
    // 背景元素
    backgroundContainer: document.getElementById('background-container'),
    backgroundImage: document.getElementById('background-image'),
    overlay: document.getElementById('overlay'),
    
    // 个人信息元素
    userAvatar: document.getElementById('user-avatar'),
    avatarUpload: document.getElementById('avatar-upload'),
    avatarContainer: document.getElementById('avatar-container'),
    userName: document.getElementById('user-name'),
    
    // 导航链接元素
    linksGridMain: document.getElementById('links-grid-main'),
    
    // 控制面板按钮
    settingsButton: document.getElementById('settings-button'),
    addLinkButton: document.getElementById('add-link-button'),
    
    // 设置模态框
    settingsModal: document.getElementById('settings-modal'),
    closeSettings: document.getElementById('close-settings'),
    saveSettings: document.getElementById('save-settings'),
    
    // 背景设置
    bgType: document.getElementById('bg-type'),
    bgColor: document.getElementById('bg-color'),
    bgImageUpload: document.getElementById('bg-image-upload'),
    bgOpacity: document.getElementById('bg-opacity'),
    bgOpacityValue: document.getElementById('bg-opacity-value'),
    bgImageSettings: document.querySelector('.bg-image-settings'),
    
    // 用户信息设置
    editUserName: document.getElementById('edit-user-name'),
    changeAvatar: document.getElementById('change-avatar'),
    
    // 添加链接模态框
    addLinkModal: document.getElementById('add-link-modal'),
    closeAddLink: document.getElementById('close-add-link'),
    saveLink: document.getElementById('save-link'),
    linkName: document.getElementById('link-name'),
    linkUrl: document.getElementById('link-url'),
    linkCategory: document.getElementById('link-category')
};

// 应用设置
let appSettings = {
    backgroundColor: '#1a1a2e',
    backgroundType: 'color',
    backgroundImage: '',
    backgroundOpacity: 0.8,
    userName: '个人导航页',
    userAvatar: ''
};

// 导航链接数据
let navigationLinks = [];

// 重复的init函数已删除 - 后续代码中已有完整实现

// 加载本地数据
function loadLocalData() {
    try {
        // 加载设置
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            appSettings = {...appSettings, ...JSON.parse(savedSettings)};
        }
        
        // 加载导航链接
        const savedLinks = localStorage.getItem('navigationLinks');
        if (savedLinks) {
            navigationLinks = JSON.parse(savedLinks);
        } else {
            navigationLinks = DEFAULT_LINKS;
            localStorage.setItem('navigationLinks', JSON.stringify(navigationLinks));
        }
        
        // 加载头像
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            appSettings.userAvatar = savedAvatar;
        }
        
        // 加载背景图片
        const savedBackgroundImage = localStorage.getItem('backgroundImage');
        if (savedBackgroundImage) {
            appSettings.backgroundImage = savedBackgroundImage;
            appSettings.backgroundType = 'image';
        }
    } catch (error) {
        console.error('加载本地数据失败:', error);
        navigationLinks = DEFAULT_LINKS;
    }
}

// 优化本地存储操作，添加错误处理和存储检查
function saveLocalData() {
    try {
        // 检查localStorage是否可用
        if (typeof localStorage === 'undefined') {
            throw new Error('本地存储不可用');
        }
        
        // 尝试存储数据
        const settingsStr = JSON.stringify(appSettings);
        const linksStr = JSON.stringify(navigationLinks);
        
        // 检查存储大小限制
        if (settingsStr.length + linksStr.length > 5 * 1024 * 1024) { // 大约5MB限制
            throw new Error('数据大小超过存储限制');
        }
        
        localStorage.setItem('appSettings', settingsStr);
        localStorage.setItem('navigationLinks', linksStr);
    } catch (error) {
        console.error('保存本地数据失败:', error);
        showMessage('保存数据失败: ' + error.message, 'error');
    }
}

// API调用函数 - 封装fetch请求
async function apiRequest(endpoint, method = 'GET', data = null) {
    try {
        const url = `${API_BASE_URL}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`API请求失败: ${response.status} ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`API请求错误 (${endpoint}):`, error);
        throw error;
    }
}

// 从API加载导航数据
async function loadNavigationFromApi() {
    try {
        const data = await apiRequest('/navigation');
        if (data && data.links) {
            return data.links;
        }
        return [];
    } catch (error) {
        console.warn('无法从API加载导航数据，使用本地数据', error);
        return null; // 返回null表示API失败
    }
}

// 保存导航数据到API
async function saveNavigationToApi(links) {
    try {
        await apiRequest('/navigation', 'POST', { links });
        console.log('导航数据已同步到服务器');
        return true;
    } catch (error) {
        console.error('无法保存导航数据到API', error);
        showMessage('同步到云端失败，已保存到本地', 'warning');
        return false;
    }
}

// 从API加载设置
async function loadSettingsFromApi() {
    try {
        const settings = await apiRequest('/settings');
        return settings;
    } catch (error) {
        console.warn('无法从API加载设置，使用本地设置', error);
        return null; // 返回null表示API失败
    }
}

// 保存设置到API
async function saveSettingsToApi(settings) {
    try {
        await apiRequest('/settings', 'POST', settings);
        console.log('设置已同步到服务器');
        return true;
    } catch (error) {
        console.error('无法保存设置到API', error);
        showMessage('设置同步到云端失败，已保存到本地', 'warning');
        return false;
    }
}

// 添加链接到API
async function addLinkToApi(link) {
    try {
        await apiRequest('/links', 'POST', link);
        console.log('链接已同步到服务器');
        return true;
    } catch (error) {
        console.error('无法添加链接到API', error);
        return false;
    }
}

// 从API删除链接
async function deleteLinkFromApi(linkId) {
    try {
        await apiRequest(`/links/${linkId}`, 'DELETE');
        console.log('链接已从服务器删除');
        return true;
    } catch (error) {
        console.error('无法从API删除链接', error);
        return false;
    }
}

// 检查API健康状态
async function checkApiHealth() {
    try {
        await apiRequest('/health');
        return true;
    } catch (error) {
        console.warn('API不可用，将使用本地存储模式', error);
        return false;
    }
}

// 显示消息提示
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageElement = document.createElement('div');
    messageElement.className = `message-toast message-${type}`;
    messageElement.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageElement);
    
    // 显示动画
    setTimeout(() => {
        messageElement.classList.add('show');
    }, 10);
    
    // 自动关闭
    setTimeout(() => {
        messageElement.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(messageElement);
        }, 300);
    }, 3000);
}

// 加载本地数据
function loadLocalData() {
    try {
        // 加载设置
        const savedSettings = localStorage.getItem('appSettings');
        if (savedSettings) {
            appSettings = {...appSettings, ...JSON.parse(savedSettings)};
        }
        
        // 加载导航链接
        const savedLinks = localStorage.getItem('navigationLinks');
        if (savedLinks) {
            navigationLinks = JSON.parse(savedLinks);
        } else {
            navigationLinks = DEFAULT_LINKS;
            localStorage.setItem('navigationLinks', JSON.stringify(navigationLinks));
        }
        
        // 加载头像
        const savedAvatar = localStorage.getItem('userAvatar');
        if (savedAvatar) {
            appSettings.userAvatar = savedAvatar;
        }
        
        // 加载背景图片
        const savedBackgroundImage = localStorage.getItem('backgroundImage');
        if (savedBackgroundImage) {
            appSettings.backgroundImage = savedBackgroundImage;
            appSettings.backgroundType = 'image';
        }
    } catch (error) {
        console.error('加载本地数据失败:', error);
        navigationLinks = DEFAULT_LINKS;
    }
}

// 优化本地存储操作，添加错误处理和存储检查
function saveLocalData() {
    try {
        // 检查localStorage是否可用
        if (typeof localStorage === 'undefined') {
            throw new Error('本地存储不可用');
        }
        
        // 尝试存储数据
        const settingsStr = JSON.stringify(appSettings);
        const linksStr = JSON.stringify(navigationLinks);
        
        // 检查存储大小限制
        if (settingsStr.length + linksStr.length > 5 * 1024 * 1024) { // 大约5MB限制
            throw new Error('数据大小超过存储限制');
        }
        
        localStorage.setItem('appSettings', settingsStr);
        localStorage.setItem('navigationLinks', linksStr);
    } catch (error) {
        console.error('保存本地数据失败:', error);
        showMessage('保存数据失败: ' + error.message, 'error');
    }
}

// 初始化函数
async function init() {
    try {
        // 加载本地数据作为回退
        loadLocalData();
        
        // 应用设置
        applySettings();
        
        // 立即设置事件监听器，确保按钮交互功能可用
        setupEventListeners();
        
        // 优化性能：添加事件委托处理点击事件
        document.addEventListener('click', function(event) {
          const linkElement = event.target.closest('.link-card');
          if (linkElement && linkElement.href) {
            // 链接已经有href，无需额外处理
          }
          
          // 处理删除链接按钮点击
          const deleteButton = event.target.closest('.delete-button');
          if (deleteButton && deleteButton.parentNode) {
            const linkId = deleteButton.parentNode.dataset.linkId;
            if (linkId) deleteLink(linkId);
          }
        });
        
        // 渲染初始导航链接
        renderLinks();
        
        // 异步检查API健康状态和加载云端数据，不阻塞UI
        try {
            const apiAvailable = await checkApiHealth();
            if (apiAvailable) {
                console.log('API可用，从云端加载数据...');
                
                // 异步加载API数据
                const [apiLinks, apiSettings] = await Promise.all([
                    loadNavigationFromApi().catch(() => null),
                    loadSettingsFromApi().catch(() => null)
                ]);
                
                // 更新导航链接
                if (apiLinks && apiLinks.length > 0) {
                    navigationLinks = apiLinks;
                    renderLinks();
                    localStorage.setItem('navigationLinks', JSON.stringify(navigationLinks));
                    console.log('已从云端同步导航数据');
                }
                
                // 更新设置
                if (apiSettings) {
                    appSettings = { ...appSettings, ...apiSettings };
                    applySettings();
                    localStorage.setItem('appSettings', JSON.stringify(appSettings));
                    console.log('已从云端同步设置');
                }
                
                showMessage('已连接云端服务器', 'success');
            } else {
                console.log('API不可用，使用本地数据');
            }
        } catch (apiError) {
            console.error('API数据加载失败:', apiError);
            // 不阻止继续运行，UI功能已可用
        }
        
        console.log('导航页初始化完成');
    } catch (error) {
        console.error('初始化失败:', error);
        // 确保至少显示默认链接
        if (navigationLinks.length === 0) {
            navigationLinks = DEFAULT_LINKS;
        }
        renderLinks();
        // 确保事件监听器已设置
        setupEventListeners();
        showMessage('初始化时出现错误，使用默认设置', 'error');
    }
}

// 保存设置
async function saveSettings() {
    // 更新设置对象
    appSettings.backgroundColor = elements.bgColor.value;
    appSettings.backgroundType = elements.bgType.value;
    appSettings.backgroundOpacity = parseFloat(elements.bgOpacity.value);
    
    // 更新用户名
    if (elements.editUserName.value.trim()) {
        appSettings.userName = elements.editUserName.value.trim();
    }
    
    // 应用设置
    applySettings();
    
    // 保存到本地
    saveLocalData();
    
    // 尝试同步到API
    await saveSettingsToApi(appSettings);
    
    // 关闭模态框
    closeSettingsModal();
    
    // 显示保存成功消息
    showMessage('设置已保存', 'success');
}

// 添加链接
async function addLink() {
    const name = elements.linkName.value.trim();
    const url = elements.linkUrl.value.trim();
    const category = elements.linkCategory.value;
    
    // 验证输入
    if (!name || !url) {
        showMessage('请填写链接名称和地址', 'error');
        return;
    }
    
    // 验证URL格式
    try {
        new URL(url.startsWith('http') ? url : `http://${url}`);
    } catch (e) {
        showMessage('请输入有效的链接地址', 'error');
        return;
    }
    
    // 创建新链接
    const newLink = {
        id: Date.now().toString(),
        name: name,
        url: url.startsWith('http') ? url : `http://${url}`,
        category: category,
        icon: name.charAt(0).toUpperCase()
    };
    
    // 添加到链接数组
    navigationLinks.push(newLink);
    
    // 保存到本地
    saveLocalData();
    
    // 尝试同步到API
    await Promise.all([
        addLinkToApi(newLink),
        saveNavigationToApi(navigationLinks)
    ]);
    
    // 重新渲染链接
    renderLinks();
    
    // 清空输入并关闭模态框
    elements.linkName.value = '';
    elements.linkUrl.value = '';
    closeAddLinkModal();
    
    // 显示添加成功消息
    showMessage('链接添加成功', 'success');
}

// 删除链接
async function deleteLink(linkId) {
    if (confirm('确定要删除这个链接吗？')) {
        // 更新本地数据
        navigationLinks = navigationLinks.filter(link => link.id !== linkId);
        saveLocalData();
        
        // 尝试同步到API
        await Promise.all([
            deleteLinkFromApi(linkId),
            saveNavigationToApi(navigationLinks)
        ]);
        
        renderLinks();
        showMessage('链接已删除', 'info');
    }
}

// 使用防抖优化头像上传处理
const handleAvatarUpload = debounce(function(file) {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.match('image.*')) {
        showMessage('请上传图片文件', 'error');
        return;
    }
    
    // 验证文件大小（限制为2MB）
    if (file.size > 2 * 1024 * 1024) {
        showMessage('图片大小不能超过2MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const avatarDataUrl = e.target.result;
        appSettings.userAvatar = avatarDataUrl;
        localStorage.setItem('userAvatar', avatarDataUrl);
        elements.userAvatar.src = avatarDataUrl;
        showMessage('头像已更新', 'success');
    };
    reader.readAsDataURL(file);
}, 300);

// 使用防抖优化背景图片上传处理
const handleBackgroundImageUpload = debounce(function(file) {
    if (!file) return;
    
    // 验证文件类型
    if (!file.type.match('image.*')) {
        showMessage('请上传图片文件', 'error');
        return;
    }
    
    // 验证文件大小（限制为5MB）
    if (file.size > 5 * 1024 * 1024) {
        showMessage('图片大小不能超过5MB', 'error');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const imageDataUrl = e.target.result;
        appSettings.backgroundImage = imageDataUrl;
        appSettings.backgroundType = 'image';
        localStorage.setItem('backgroundImage', imageDataUrl);
        elements.bgType.value = 'image';
        elements.bgImageSettings.style.display = 'block';
        applySettings();
        showMessage('背景图片已更新', 'success');
    };
    reader.readAsDataURL(file);
}, 300);

// 显示消息提示
function showMessage(message, type = 'info') {
    // 检查是否已有消息元素
    let messageElement = document.getElementById('message-toast');
    if (messageElement) {
        document.body.removeChild(messageElement);
    }
    
    // 创建新消息元素
    messageElement = document.createElement('div');
    messageElement.id = 'message-toast';
    messageElement.textContent = message;
    
    // 设置样式
    messageElement.style.cssText = `
        position: fixed;
        top: 2rem;
        right: 2rem;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    `;
    
    // 根据类型设置背景色
    switch (type) {
        case 'success':
            messageElement.style.backgroundColor = '#10b981';
            break;
        case 'error':
            messageElement.style.backgroundColor = '#ef4444';
            break;
        case 'info':
        default:
            messageElement.style.backgroundColor = '#3b82f6';
            break;
    }
    
    // 添加到文档
    document.body.appendChild(messageElement);
    
    // 显示消息
    setTimeout(() => {
        messageElement.style.transform = 'translateX(0)';
    }, 10);
    
    // 自动隐藏
    setTimeout(() => {
        messageElement.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (messageElement.parentNode) {
                document.body.removeChild(messageElement);
            }
        }, 300);
    }, 3000);
}

// 打开设置模态框
function openSettingsModal() {
    elements.editUserName.value = appSettings.userName;
    elements.settingsModal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// 关闭设置模态框
function closeSettingsModal() {
    elements.settingsModal.classList.remove('active');
    document.body.style.overflow = '';
}

// 打开添加链接模态框
function openAddLinkModal() {
    elements.linkName.value = '';
    elements.linkUrl.value = '';
    elements.addLinkModal.classList.add('active');
    document.body.style.overflow = 'hidden';
    elements.linkName.focus();
}

// 关闭添加链接模态框
function closeAddLinkModal() {
    elements.addLinkModal.classList.remove('active');
    document.body.style.overflow = '';
}

// 设置事件监听器
function setupEventListeners() {
    // 控制面板按钮事件
    elements.settingsButton.addEventListener('click', openSettingsModal);
    elements.addLinkButton.addEventListener('click', openAddLinkModal);
    
    // 设置模态框事件
    elements.closeSettings.addEventListener('click', closeSettingsModal);
    elements.saveSettings.addEventListener('click', saveSettings);
    
    // 添加链接模态框事件
    elements.closeAddLink.addEventListener('click', closeAddLinkModal);
    elements.saveLink.addEventListener('click', addLink);
    
    // 背景类型切换
    elements.bgType.addEventListener('change', function() {
        elements.bgImageSettings.style.display = this.value === 'image' ? 'block' : 'none';
    });
    
    // 背景透明度调整 - 使用节流优化
    const handleOpacityChange = throttle(function() {
        elements.bgOpacityValue.textContent = `${Math.round(this.value * 100)}%`;
    }, 100); // 每100ms最多执行一次
    
    elements.bgOpacity.addEventListener('input', handleOpacityChange);
    
    // 头像上传事件
    elements.avatarContainer.addEventListener('click', () => {
        elements.avatarUpload.click();
    });
    
    elements.avatarUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleAvatarUpload(this.files[0]);
        }
        // 重置input以允许重新选择同一文件
        this.value = '';
    });
    
    elements.changeAvatar.addEventListener('click', () => {
        elements.avatarUpload.click();
    });
    
    // 背景图片上传事件
    elements.bgImageUpload.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            handleBackgroundImageUpload(this.files[0]);
        }
    });
    
    // 点击模态框外部关闭
    elements.settingsModal.addEventListener('click', (e) => {
        if (e.target === elements.settingsModal) {
            closeSettingsModal();
        }
    });
    
    elements.addLinkModal.addEventListener('click', (e) => {
        if (e.target === elements.addLinkModal) {
            closeAddLinkModal();
        }
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeSettingsModal();
            closeAddLinkModal();
        }
    });
    
    // 按Enter键添加链接
    elements.linkUrl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addLink();
        }
    });
}

// 生成唯一ID
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 当文档加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}