import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('====================================');
console.log('确保 Nginx 正确配置已加载（修复版）');
console.log('====================================');

function getNginxConfigPath() {
    // 根据系统选择配置路径
    const projectRoot = path.resolve(__dirname, '..');
    const configPath = path.join(projectRoot, 'nginx', 'nginx.conf');
    console.log(`[Nginx] 使用配置文件: ${configPath}`);
    return configPath;
}

async function ensureNginxConfig() {
    try {
        const configPath = getNginxConfigPath();
        
        // 检查配置文件是否存在
        if (!fs.existsSync(configPath)) {
            console.log(`[Nginx] ❌ 错误: 配置文件不存在: ${configPath}`);
            console.log(`[Nginx] 尝试生成配置文件...`);
            
            // 确保nginx目录存在
            const nginxDir = path.dirname(configPath);
            if (!fs.existsSync(nginxDir)) {
                fs.mkdirSync(nginxDir, { recursive: true });
                console.log(`[Nginx] 创建目录: ${nginxDir}`);
            }
            
            // 创建基础配置文件（避免调用可能有问题的生成脚本）
            const basicConfig = `# 基础Nginx配置文件
worker_processes auto;
error_log logs/error.log;
pid logs/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include       mime.types;
    default_type  application/octet-stream;
    
    sendfile        on;
    keepalive_timeout  65;
    
    # 管理平台 upstream
    upstream st_manager {
        server 127.0.0.1:3000;
    }
    
    server {
        listen 80;
        server_name localhost;
        
        # 管理平台根路径
        location / {
            proxy_pass http://st_manager;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}`;
            
            fs.writeFileSync(configPath, basicConfig);
            console.log(`[Nginx] ✅ 基础配置文件已创建: ${configPath}`);
        } else {
            console.log(`[Nginx] ✅ 配置文件存在: ${configPath}`);
        }
        
        // 测试配置文件语法
        try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execPromise = promisify(exec);
            
            await execPromise(`nginx -t -c "${configPath}"`);
            console.log(`[Nginx] ✅ 配置文件语法检查通过`);
        } catch (testError) {
            console.log(`[Nginx] ⚠️  配置文件语法检查失败，但不影响服务器启动`);
            console.log(`[Nginx] 错误详情: ${testError.message}`);
        }
        
    } catch (error) {
        console.error(`[Nginx] ❌ 确保配置过程出错: ${error.message}`);
        // 不要抛出错误，允许服务器继续启动
        console.log(`[Nginx] ℹ️  继续启动服务器，Nginx配置可稍后修复`);
    }
}

// 执行检查
await ensureNginxConfig();
console.log('[Nginx] 配置检查完成');
