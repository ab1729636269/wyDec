// Cloudflare Pages Functions - 设置管理API
import { getData, saveData, handleOptions, checkRateLimit, createResponse, DEFAULT_NAVIGATION_DATA } from './_shared';

export async function onRequest(context) {
  const { request, env } = context;
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
    // 获取设置
    if (request.method === 'GET') {
      const navigationData = await getData('navigation_data', env);
      return createResponse({
        success: true,
        data: navigationData.settings || DEFAULT_NAVIGATION_DATA.settings
      });
    }
    
    // 保存设置
    if (request.method === 'POST') {
      const navigationData = await getData('navigation_data', env);
      let settingsData;
      
      try {
        settingsData = await request.json();
      } catch (e) {
        return createResponse({
          success: false,
          message: '无效的JSON格式'
        }, 400);
      }
      
      // 验证设置数据
      if (!settingsData || typeof settingsData !== 'object') {
        return createResponse({
          success: false,
          message: '无效的设置格式'
        }, 400);
      }
      
      // 更新设置
      navigationData.settings = {
        ...(navigationData.settings || {}),
        ...settingsData
      };
      
      // 保存到KV
      const saved = await saveData('navigation_data', navigationData, env);
      
      if (saved) {
        return createResponse({
          success: true,
          message: '设置保存成功',
          data: navigationData.settings
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
    console.error('处理设置请求时出错:', error);
    return createResponse({
      success: false,
      message: '服务器内部错误'
    }, 500);
  }
}