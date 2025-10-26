# 个人导航页应用

一个现代化、功能齐全的个人导航页应用，支持透明背景、头像上传、响应式设计等高级特性，可部署在Cloudflare Pages上，支持本地存储和云端同步双重数据保护机制。

## 🎯 功能特性

- **透明背景效果**：支持纯色背景和自定义背景图片，可调节透明度
- **用户头像系统**：支持上传和显示个人头像
- **简洁直观UI**：现代化设计，突出导航核心功能
- **响应式布局**：完美适配桌面端、平板和移动设备
- **本地数据存储**：使用浏览器localStorage保存用户设置和链接
- **Cloudflare集成**：通过Cloudflare Pages Functions实现数据同步和云存储
- **自定义设置**：可自定义背景、用户名等个人化信息
- **分类导航**：支持导航链接管理和分类
- **自动降级机制**：当API不可用时自动降级到本地存储模式

## 📁 项目结构

```
├── index.html           # 主页面
├── style.css            # 样式文件
├── script.js            # 前端JavaScript
├── functions/           # Pages Functions 目录（存放API端点）
│   ├── api/
│   │   ├── _shared.js   # 共享工具函数
│   │   ├── navigation.js # 导航数据API
│   │   ├── links.js     # 链接管理API
│   │   ├── settings.js  # 设置管理API
│   │   └── health.js    # 健康检查API
├── _redirects           # 重定向配置
└── pages-functions.js   # 环境变量和KV绑定配置指南
```

## Cloudflare Pages 部署指南

本文档提供在 Cloudflare Pages 平台上同时部署前端和后端内容的详细指南。通过这种方式，您可以将整个应用作为单一项目进行管理，实现更简化的部署流程。

## 1. 项目结构

部署到 Cloudflare Pages 的项目具有以下关键结构：

```
├── index.html           # 主页面
├── style.css            # 样式文件
├── script.js            # 前端JavaScript
├── functions/           # Pages Functions 目录（存放API端点）
│   ├── api/
│   │   ├── _shared.js   # 共享工具函数
│   │   ├── navigation.js # 导航数据API
│   │   ├── links.js     # 链接管理API
│   │   ├── settings.js  # 设置管理API
│   │   └── health.js    # 健康检查API
├── _redirects           # 重定向配置
└── pages-functions.js   # 环境变量和KV绑定配置指南
```

## 2. 环境要求与前置条件

### 2.1 开发环境要求

- **操作系统**：Windows、macOS或Linux
- **Node.js**：v16或更高版本（可选，用于本地开发）
- **Git**：版本控制系统
- **现代Web浏览器**：Chrome、Firefox、Safari或Edge的最新版本

### 2.2 Cloudflare账户要求

- **Cloudflare账户**：注册并登录[Cloudflare](https://dash.cloudflare.com/)
- **Pages访问权限**：需要有权限创建和管理Pages项目
- **KV命名空间**：需要有权限创建KV命名空间（用于数据存储）

### 2.3 API功能说明

- `/api/navigation` - 导航数据的获取和保存
- `/api/links` - 链接的添加和删除
- `/api/settings` - 应用设置的获取和保存
- `/api/health` - 健康检查端点

## 3. 部署前准备

### 3.1 创建Cloudflare账户

如果您还没有Cloudflare账户，请先[注册](https://dash.cloudflare.com/sign-up)。

### 3.2 创建KV命名空间

1. 登录Cloudflare控制台
2. 导航至 **Workers & Pages** > **KV命名空间**
3. 点击 **创建KV命名空间**
4. 名称设置为 `NAVIGATOR_DATA`
5. 点击 **创建**

## 4. 部署步骤

### 4.1 使用Git仓库部署（推荐）

1. 将项目代码推送到GitHub或GitLab等支持的Git提供商

2. 在Cloudflare控制台中：
   - 导航至 **Workers & Pages** > **Pages**
   - 点击 **连接到Git**
   - 选择您的仓库
   - 点击 **开始设置**

3. 配置构建设置：
   - 项目名称：自定义（如`personal-navigator`）
   - 生产分支：`main`或您的主分支
   - 构建命令：留空（或使用静态文件构建器）
   - 构建输出目录：`/`（根目录）
   - 环境变量：点击 **添加环境变量**

4. 添加环境变量：
   - `ADMIN_PASSWORD`: 设置一个安全的管理密码
   - `ADMIN_TOKEN`: 生成并设置一个随机的管理令牌

5. 绑定KV命名空间：
   - 点击 **设置** > **函数** > **KV命名空间绑定**
   - 变量名称：`NAVIGATOR_DATA`
   - KV命名空间：选择之前创建的`NAVIGATOR_DATA`
   - 环境：选择 **生产**
   - 点击 **保存**

6. 点击 **部署站点** 开始部署过程

### 4.2 直接上传部署

1. 将项目文件打包为ZIP文件

2. 在Cloudflare控制台中：
   - 导航至 **Workers & Pages** > **Pages**
   - 点击 **上传资产**
   - 拖放您的ZIP文件或选择文件

3. 配置设置：
   - 项目名称：自定义
   - 环境变量：添加`ADMIN_PASSWORD`和`ADMIN_TOKEN`

4. 绑定KV命名空间（步骤同Git部署）

5. 点击 **部署站点**

## 5. 配置重定向

项目中包含`_redirects`文件，确保API请求正确路由到Pages Functions：

```
/api/*  /api/:splat  200
```

此配置确保所有以`/api/`开头的请求都被正确处理。

## 6. 环境变量和KV绑定

### 6.1 必要的环境变量

| 变量名 | 描述 | 是否必需 |
|--------|------|----------|
| ADMIN_PASSWORD | 管理密码，用于保护API | 否（但强烈推荐） |
| ADMIN_TOKEN | 管理令牌，用于API身份验证 | 否（但强烈推荐） |

### 6.2 KV命名空间绑定

| 绑定名称 | KV命名空间 | 用途 |
|---------|------------|------|
| NAVIGATOR_DATA | NAVIGATOR_DATA | 存储导航数据、链接和设置 |

## 7. 部署后验证

### 7.1 检查部署状态

1. 在Cloudflare控制台中查看部署历史
2. 确保部署状态显示为**成功**
3. 访问提供的预览URL或自定义域名

### 7.2 验证API功能

访问以下端点以验证API是否正常工作：

- 健康检查：`https://your-project.pages.dev/api/health`
- 获取导航数据：`https://your-project.pages.dev/api/navigation`

## 8. 多设备同步功能

前端代码已配置为自动检测API可用性并在有网络连接时同步数据：

- 页面加载时，先尝试从API获取最新数据
- 当数据发生变化时（添加/删除链接、修改设置），同时保存到本地存储和API
- 当API不可用时，自动降级到本地存储模式，确保离线使用
- 当API恢复可用时，自动同步本地数据

## 9. 错误处理和故障转移

系统包含多层错误处理机制：

1. API请求失败时，显示友好的用户提示
2. 自动回退到本地存储，确保应用继续可用
3. 控制台日志记录详细错误信息，便于调试
4. 数据保存时的大小检查，避免超出存储限制

## 10. 最佳实践

1. **定期备份**：虽然有云存储，但仍建议定期导出重要数据
2. **使用强密码**：为`ADMIN_PASSWORD`和`ADMIN_TOKEN`设置复杂的值
3. **监控使用**：定期检查Cloudflare仪表盘的使用统计
4. **安全更新**：定期更新项目依赖和Cloudflare Pages运行时

## 11. 故障排除

### 常见问题及解决方案

1. **API返回404错误**
   - 检查`functions/api/`目录结构是否正确
   - 确认重定向规则是否正确配置

2. **KV存储错误**
   - 检查KV命名空间是否正确绑定
   - 验证绑定名称是否为`NAVIGATOR_DATA`

3. **环境变量不可用**
   - 确认环境变量是否在正确的环境（生产/预览）中设置
   - 重新部署以应用最新的环境变量更改

4. **数据同步问题**
   - 清除浏览器缓存后重试
   - 检查控制台错误日志，识别具体问题

## 12. API端点详细说明

### 12.1 获取导航数据
- **URL**: `/api/navigation`
- **方法**: `GET`
- **响应**: 返回所有导航链接和设置

### 12.2 保存导航数据
- **URL**: `/api/navigation`
- **方法**: `POST`
- **请求体**: 导航数据对象
- **响应**: 保存结果

### 12.3 添加链接
- **URL**: `/api/links`
- **方法**: `POST`
- **请求体**: 链接数据对象
- **响应**: 创建的链接信息

### 12.4 删除链接
- **URL**: `/api/links/:id`
- **方法**: `DELETE`
- **响应**: 删除结果

### 12.5 获取/保存设置
- **URL**: `/api/settings`
- **方法**: `GET` / `POST`
- **响应**: 设置数据

### 12.6 健康检查
- **URL**: `/api/health`
- **方法**: `GET`
- **响应**: 服务状态

## 13. 后续扩展

1. 添加用户认证系统，支持多用户
2. 实现自定义域名配置
3. 增加更多自定义主题和布局选项
4. 添加数据导入/导出功能

## 14. 许可证

MIT License

---

本部署方案遵循KISS和YAGNI原则，保持架构简单而强大，同时为未来扩展预留了空间。通过将前端和后端整合到同一Cloudflare Pages项目中，大大简化了部署和管理流程。祝您使用愉快！
