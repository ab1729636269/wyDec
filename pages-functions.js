// Cloudflare Pages Functions 配置文件
// 注意：此文件定义部署时需要在Cloudflare控制台设置的绑定配置

/**
 * 环境变量和KV存储绑定配置指南
 * 
 * 在Cloudflare Pages项目设置中，需要配置以下内容：
 * 
 * 1. KV命名空间绑定
 *    - 绑定名称: NAVIGATOR_DATA
 *    - KV命名空间: [您创建的KV命名空间ID]
 * 
 * 2. 环境变量 (生产环境)
 *    - ADMIN_PASSWORD: [强密码]
 *    - ADMIN_TOKEN: [安全的API令牌]
 *    
 * 3. 环境变量 (开发环境，可选)
 *    - 可以在本地开发时设置
 */

// 这个文件在运行时不被实际执行，仅作为配置参考
export const config = {
  kvNamespaces: [
    {
      binding: 'NAVIGATOR_DATA',
      description: '存储导航数据的KV命名空间'
    }
  ],
  environmentVariables: [
    {
      name: 'ADMIN_PASSWORD',
      description: '管理员密码，用于API访问控制',
      required: true
    },
    {
      name: 'ADMIN_TOKEN', 
      description: 'API访问令牌，用于身份验证',
      required: true
    }
  ]
};