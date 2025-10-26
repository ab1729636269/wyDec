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

// CORS 配置
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400'
};

// 从KV获取数据
export async function getData(key, env) {
  try {
    // 检查NAVIGATOR_DATA KV命名空间是否可用
    if (typeof env.NAVIGATOR_DATA === 'undefined') {
      console.error('KV命名空间 NAVIGATOR_DATA 未配置');
      return DEFAULT_NAVIGATION_DATA;
    }
    
    const data = await env.NAVIGATOR_DATA.get(key, { type: 'json' });
    return data || DEFAULT_NAVIGATION_DATA;
  } catch (error) {
    console.error(`获取数据失败 [${key}]:`, error);
    return DEFAULT_NAVIGATION_DATA;
  }
}

// 保存数据到KV
export async function saveData(key, data, env) {
  try {
    if (typeof env.NAVIGATOR_DATA === 'undefined') {
      console.error('KV命名空间 NAVIGATOR_DATA 未配置，无法保存数据');
      return false;
    }
    
    await env.NAVIGATOR_DATA.put(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`保存数据失败 [${key}]:`, error);
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
    headers: CORS_HEADERS
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
export function createResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS
    }
  });
}