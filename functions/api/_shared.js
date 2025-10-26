// Cloudflare Pages Functions 共享工具

// 默认导航数据
export const DEFAULT_NAVIGATION_DATA = {
  links: [
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
  ],
  settings: {
    backgroundColor: '#1a1a2e',
    backgroundType: 'color',
    backgroundOpacity: 0.8,
    userName: '个人导航页'
  }
};

// CORS 配置 - 符合Cloudflare安全最佳实践
export const CORS_HEADERS = {
  // 使用更安全的CORS配置，避免使用通配符
  // 在Cloudflare Pages环境中，这通常会自动处理，但明确设置更安全
  'Access-Control-Allow-Origin': self.location.origin || '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '3600', // 减少预检请求缓存时间
  'Access-Control-Expose-Headers': 'Content-Type, X-Request-ID'
};

// 辅助函数：判断是否为网络错误
function isNetworkError(error) {
  return error.name === 'NetworkError' || 
         error.message.includes('network') ||
         error.message.includes('timeout') ||
         error.message.includes('connection');
}

// 辅助函数：判断是否为临时错误
function isTemporaryError(error) {
  const temporaryErrorCodes = ['ETIMEDOUT', 'ECONNRESET', 'EAGAIN'];
  return temporaryErrorCodes.some(code => error.message.includes(code));
}

// 获取适合当前请求的CORS头
export function getCorsHeaders(request) {
  // 在生产环境中，应该验证Origin头
  const origin = request.headers.get('Origin') || '*';
  return {
    ...CORS_HEADERS,
    'Access-Control-Allow-Origin': origin
  };
}

// 从KV获取数据
export async function getData(key, env) {
  try {
    // 检查env是否存在且包含KV命名空间
    if (!env || typeof env.NAVIGATION_DATA === 'undefined') {
      console.warn('KV命名空间未配置，返回默认数据');
      // 返回默认数据作为降级方案
      return DEFAULT_NAVIGATION_DATA;
    }
    
    try {
      // 添加重试逻辑
      const maxRetries = 2;
      let lastError;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const data = await env.NAVIGATION_DATA.get(key, { type: 'json' });
          // 如果数据不存在且是导航数据，返回默认值
          if (!data) {
            console.info(`KV中未找到${key}，使用默认数据`);
            return DEFAULT_NAVIGATION_DATA;
          }
          return data;
        } catch (kvError) {
          lastError = kvError;
          // 只有网络相关错误才重试
          if (!isNetworkError(kvError)) {
            throw kvError;
          }
          // 指数退避
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // 所有重试都失败后，返回默认数据作为最后的降级方案
      console.error(`所有KV读取尝试失败: ${lastError.message}，使用默认数据`);
      return DEFAULT_NAVIGATION_DATA;
    } catch (kvError) {
      console.error(`KV操作异常: ${kvError.message}`);
      // 遇到严重错误时也返回默认数据
      return DEFAULT_NAVIGATION_DATA;
    }
  } catch (error) {
    console.error('获取KV数据时发生严重错误:', error);
    // 确保总是有返回值，避免函数抛出未捕获的异常
    return DEFAULT_NAVIGATION_DATA;
  }
}

// 保存数据到KV
export async function saveData(key, data, env) {
  try {
    // 检查env是否存在且包含KV命名空间
    if (!env || typeof env.NAVIGATION_DATA === 'undefined') {
      console.warn('KV命名空间未配置，无法保存数据');
      // 返回false表示保存失败，但不抛出异常
      return false;
    }
    
    // 验证数据格式
    if (!data || typeof data !== 'object') {
      console.error('尝试保存无效数据到KV');
      return false;
    }
    
    try {
      // 添加重试逻辑
      const maxRetries = 2;
      let lastError;
      
      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          await env.NAVIGATION_DATA.put(key, JSON.stringify(data));
          console.info(`数据成功保存到KV: ${key}`);
          return true;
        } catch (kvError) {
          lastError = kvError;
          // 只有网络相关错误或临时错误才重试
          if (!isNetworkError(kvError) && !isTemporaryError(kvError)) {
            throw kvError;
          }
          // 指数退避
          if (attempt < maxRetries) {
            const delay = Math.pow(2, attempt) * 100;
            await new Promise(resolve => setTimeout(resolve, delay));
          }
        }
      }
      
      // 所有重试都失败
      console.error(`所有KV写入尝试失败: ${lastError.message}`);
      return false;
    } catch (kvError) {
      console.error(`KV操作异常: ${kvError.message}`);
      return false;
    }
  } catch (error) {
    console.error('保存KV数据时发生严重错误:', error);
    // 确保总是有返回值，避免函数抛出未捕获的异常
    return false;
  }
}

// 生成唯一ID
export function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}

// 处理预检请求
export function handleOptions(request) {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(request)
  });
}

// 内存限流对象（简单实现）
const rateLimitStore = new Map();

// 检查是否超过限流
export function checkRateLimit(ip) {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1分钟窗口
  const maxRequests = 60; // 每分钟最多60个请求
  
  if (!rateLimitStore.has(ip)) {
    rateLimitStore.set(ip, []);
  }
  
  const requests = rateLimitStore.get(ip);
  
  // 移除过期的请求记录
  const recentRequests = requests.filter(time => now - time < windowMs);
  rateLimitStore.set(ip, recentRequests);
  
  // 检查是否超过限制
  if (recentRequests.length >= maxRequests) {
    return false;
  }
  
  // 添加新请求记录
  recentRequests.push(now);
  return true;
}

// 过滤敏感数据
export function filterSensitiveData(data) {
  if (!data) return data;
  
  const filtered = { ...data };
  // 移除任何可能的敏感字段
  if (filtered.secrets) delete filtered.secrets;
  if (filtered.credentials) delete filtered.credentials;
  
  return filtered;
}

// 统一响应函数
export function createResponse(data, status = 200, request = null) {
  // 使用动态CORS头或默认值
  const corsHeaders = request ? getCorsHeaders(request) : CORS_HEADERS;
  
  // 添加请求ID以便于调试
  const xRequestId = Date.now().toString(36) + Math.random().toString(36).substr(2);
  
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'X-Request-ID': xRequestId,
      ...corsHeaders
    }
  });
}