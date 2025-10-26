// Cloudflare Pages Functions - 健康检查API
import { handleOptions, createResponse } from './_shared';

export async function onRequest(context) {
  const { request } = context;
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  try {
    // 健康检查
    if (request.method === 'GET') {
      return createResponse({
        success: true,
        message: '服务正常运行',
        timestamp: Date.now()
      });
    }
    
    // 方法不允许
    return createResponse({
      success: false,
      message: '不允许的HTTP方法'
    }, 405);
    
  } catch (error) {
    console.error('处理健康检查请求时出错:', error);
    return createResponse({
      success: false,
      message: '服务器内部错误'
    }, 500);
  }
}