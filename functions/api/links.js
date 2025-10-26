// Cloudflare Pages Functions - 链接管理API
import { getData, saveData, handleOptions, checkRateLimit, generateId, createResponse } from './_shared';

export async function onRequest(context) {
  const { request, env, params } = context;
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  // 基本限流检查
  if (!checkRateLimit(ip)) {
    return createResponse({
      success: false,
      message: '请求过于频繁，请稍后再试'
    }, 429);
  }
  
  try {
    // 添加链接 (POST /api/links)
    if (request.method === 'POST') {
      const navigationData = await getData('navigation_data', env);
      let linkData;
      
      try {
        linkData = await request.json();
      } catch (e) {
        return createResponse({
          success: false,
          message: '无效的JSON格式'
        }, 400);
      }
      
      // 验证链接数据
      if (!linkData.name || !linkData.url) {
        return createResponse({
          success: false,
          message: '链接名称和URL不能为空'
        }, 400);
      }
      
      // 验证URL格式
      try {
        const url = linkData.url.startsWith('http') ? linkData.url : `http://${linkData.url}`;
        new URL(url);
        linkData.url = url;
      } catch (e) {
        return createResponse({
          success: false,
          message: '无效的URL格式'
        }, 400);
      }
      
      // 创建新链接
      const newLink = {
        id: generateId(),
        name: linkData.name,
        url: linkData.url,
        category: linkData.category || 'main',
        icon: linkData.icon || linkData.name.charAt(0).toUpperCase()
      };
      
      // 添加到链接数组
      if (!navigationData.links) {
        navigationData.links = [];
      }
      navigationData.links.push(newLink);
      
      // 保存到KV
      const saved = await saveData('navigation_data', navigationData, env);
      
      if (saved) {
        return createResponse({
          success: true,
          message: '链接添加成功',
          data: newLink
        }, 201);
      } else {
        return createResponse({
          success: false,
          message: '保存失败，请检查KV配置'
        }, 500);
      }
    }
    
    // 删除链接 (DELETE /api/links/:id)
    if (request.method === 'DELETE' && params.path[0]) {
      const linkId = params.path[0];
      const navigationData = await getData('navigation_data', env);
      
      if (!navigationData.links) {
        return createResponse({
          success: false,
          message: '没有找到链接数据'
        }, 404);
      }
      
      // 过滤掉要删除的链接
      const initialLength = navigationData.links.length;
      navigationData.links = navigationData.links.filter(link => link.id !== linkId);
      
      // 检查是否有链接被删除
      if (navigationData.links.length === initialLength) {
        return createResponse({
          success: false,
          message: '链接不存在'
        }, 404);
      }
      
      // 保存到KV
      const saved = await saveData('navigation_data', navigationData, env);
      
      if (saved) {
        return createResponse({
          success: true,
          message: '链接删除成功'
        });
      } else {
        return createResponse({
          success: false,
          message: '保存失败，请检查KV配置'
        }, 500);
      }
    }
    
    // 方法不允许
    return createResponse({
      success: false,
      message: '不允许的HTTP方法'
    }, 405);
    
  } catch (error) {
    console.error('处理链接管理请求时出错:', error);
    return createResponse({
      success: false,
      message: '服务器内部错误'
    }, 500);
  }
}