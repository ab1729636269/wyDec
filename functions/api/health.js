// Cloudflare Pages Functions - 健康检查API
import { handleOptions, createResponse } from './_shared';

export async function onRequest(context) {
  const { request } = context;
  
  // 处理预检请求
  if (request.method === 'OPTIONS') {
    return handleOptions(request);
  }
  
  try {
    // 尝试从KV存储读取数据以检查连接
    let kvStatus = 'unknown';
    try {
      // 只是尝试读取一个简单的值来验证KV连接
      const testValue = await context.env.NAVIGATOR_DATA.get('navigation');
      kvStatus = testValue !== null ? 'connected' : 'empty';
    } catch (kvError) {
      console.error('KV连接测试失败:', kvError);
      kvStatus = 'error';
    }
    
    // 健康检查
    if (request.method === 'GET') {
      // 构建健康检查响应
      const healthResponse = {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          kv: kvStatus,
          api: 'online'
        },
        environment: {
          // 添加一些环境信息，但避免暴露敏感数据
          has_auth: !!context.env.AUTH_KEY || !!context.env.ADMIN_PASSWORD || !!context.env.ADMIN_TOKEN
        }
      };
      
      return createResponse(request, healthResponse, 200);
    }
    
    // 方法不允许
    return createResponse(request, {
      success: false,
      message: '不允许的HTTP方法'
    }, 405);
    
  } catch (error) {
    console.error('处理健康检查请求时出错:', error);
    return createResponse(request, {
      success: false,
      message: '服务器内部错误'
    }, 500);
  }
}