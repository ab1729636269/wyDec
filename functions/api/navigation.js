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
    return createResponse(request, {
      success: false,
      message: '请求过于频繁，请稍后再试'
    }, 429);
  }

  // 认证头验证 (仅对非OPTIONS请求)
  if (request.method !== 'OPTIONS') {
    const authHeader = request.headers.get('Authorization');
    // 支持多种环境变量名称以兼容不同配置
    const validAuthKeys = [env.AUTH_KEY, env.ADMIN_PASSWORD, env.ADMIN_TOKEN];
    
    if (!authHeader || !validAuthKeys.includes(authHeader)) {
      return createResponse(request, {
        success: false,
        message: '未授权访问'
      }, 401);
    }
  }
  
  try {
    if (request.method === 'GET') {
      const data = await getData('navigation', env);
      return createResponse(request, {
        success: true,
        data: data
      }, 200);
    } else if (request.method === 'POST') {
      try {
        // POST方法特定逻辑 - 已在前面进行认证
        
        const body = await request.json();
        
        // 验证数据格式
        if (!Array.isArray(body)) {
          return createResponse(request, {
            success: false,
            message: '无效的数据格式，期望数组'
          }, 400);
        }
        
        const success = await saveData('navigation', body, env);
        
        if (success) {
          return createResponse(request, {
            success: true,
            message: '导航数据已更新',
            timestamp: new Date().toISOString()
          }, 200);
        } else {
          return createResponse(request, {
            success: false,
            message: '无法保存导航数据'
          }, 500);
        }
      } catch (jsonError) {
        return createResponse(request, {
          success: false,
          message: '无效的JSON格式',
          error: jsonError.message
        }, 400);
      }
    } else {
      return createResponse(request, {
        success: false,
        message: '不允许的HTTP方法',
        allowedMethods: ['GET', 'POST', 'OPTIONS']
      }, 405);
    }
  } catch (error) {
    console.error('Navigation API 错误:', error);
    return createResponse(request, {
      success: false,
      message: '服务器内部错误',
      errorId: Date.now().toString(36)
    }, 500);
  }
}