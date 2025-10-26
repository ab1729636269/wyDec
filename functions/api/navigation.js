// Cloudflare Pages Functions - 导航数据API
import { getData, saveData, handleOptions, checkRateLimit, createResponse } from './_shared';

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
    // 获取导航数据
    if (request.method === 'GET') {
      const navigationData = await getData('navigation_data', env);
      return createResponse({
        success: true,
        data: navigationData
      });
    }
    
    // 保存导航数据
    if (request.method === 'POST') {
      const navigationData = await getData('navigation_data', env);
      let newData;
      
      try {
        newData = await request.json();
      } catch (e) {
        return createResponse({
          success: false,
          message: '无效的JSON格式'
        }, 400);
      }
      
      // 数据验证
      if (!newData || typeof newData !== 'object') {
        return createResponse({
          success: false,
          message: '无效的数据格式'
        }, 400);
      }
      
      // 合并数据
      const updatedData = {
        ...navigationData,
        ...newData
      };
      
      // 保存到KV
      const saved = await saveData('navigation_data', updatedData, env);
      
      if (saved) {
        return createResponse({
          success: true,
          message: '导航数据保存成功',
          data: updatedData
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
    console.error('处理导航数据请求时出错:', error);
    return createResponse({
      success: false,
      message: '服务器内部错误'
    }, 500);
  }
}