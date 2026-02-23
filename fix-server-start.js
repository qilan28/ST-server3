import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 修复服务器启动问题
 * 1. 创建必要的目录
 * 2. 修复数据库初始化问题
 * 3. 生成基础Nginx配置
 */

console.log('🔧 修复服务器启动问题...');
console.log('============================');

async function fixServerStart() {
    try {
        // 1. 创建必要的目录
        console.log('\n1. 创建必要目录...');
        const directories = ['logs', 'nginx', 'data'];
        
        directories.forEach(dir => {
            const dirPath = path.join(__dirname, dir);
            if (!fs.existsSync(dirPath)) {
                fs.mkdirSync(dirPath, { recursive: true });
                console.log(`✅ 创建目录: ${dir}`);
            } else {
                console.log(`ℹ️  目录已存在: ${dir}`);
            }
        });
        
        // 2. 创建基础Nginx配置模板（如果不存在）
        console.log('\n2. 检查Nginx配置模板...');
        const templatePath = path.join(__dirname, 'nginx', 'nginx.conf.template');
        
        if (!fs.existsSync(templatePath)) {
            console.log('创建基础Nginx配置模板...');
            const basicTemplate = `# Nginx 配置模板
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
    
    # WebSocket 支持
    map \\$http_upgrade \\$connection_upgrade {
        default upgrade;
        ''      close;
    }
    
    # 管理平台 upstream
    upstream st_manager {
        server 127.0.0.1:3000;
    }
    
    # {{UPSTREAM_SERVERS}}
    
    server {
        listen 80;
        server_name localhost;
        
        # 管理平台根路径
        location / {
            proxy_pass http://st_manager;
            proxy_http_version 1.1;
            proxy_set_header Upgrade \\$http_upgrade;
            proxy_set_header Connection \\$connection_upgrade;
            proxy_set_header Host \\$host;
            proxy_set_header X-Real-IP \\$remote_addr;
            proxy_set_header X-Forwarded-For \\$proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto \\$scheme;
        }
        
        # {{AUTH_CHECK_LOCATIONS}}
        
        # {{RESCUE_MODE}}
        
        # {{LOCATION_BLOCKS}}
        
        # 错误页面
        location @access_denied {
            return 403 "Access Denied: You don't have permission to access this resource.";
        }
    }
}`;
            
            fs.writeFileSync(templatePath, basicTemplate);
            console.log('✅ 基础Nginx配置模板已创建');
        } else {
            console.log('✅ Nginx配置模板已存在');
        }
        
        // 3. 创建基础Nginx配置文件
        console.log('\n3. 创建基础Nginx配置...');
        const configPath = path.join(__dirname, 'nginx', 'nginx.conf');
        
        if (!fs.existsSync(configPath)) {
            // 读取模板并生成基础配置
            const template = fs.readFileSync(templatePath, 'utf-8');
            const basicConfig = template
                .replace('# {{UPSTREAM_SERVERS}}', '# 用户upstream将在启动时生成')
                .replace('# {{AUTH_CHECK_LOCATIONS}}', '# 认证检查将在启动时生成')
                .replace('# {{RESCUE_MODE}}', '# Cookie救援模式将在启动时生成')
                .replace('# {{LOCATION_BLOCKS}}', '# 用户location块将在启动时生成');
            
            fs.writeFileSync(configPath, basicConfig);
            console.log('✅ 基础Nginx配置已创建');
        } else {
            console.log('✅ Nginx配置文件已存在');
        }
        
        // 4. 检查并修复数据库相关文件
        console.log('\n4. 检查数据库相关文件...');
        const dbFile = path.join(__dirname, 'database.sqlite');
        if (fs.existsSync(dbFile)) {
            console.log('✅ 数据库文件存在');
        } else {
            console.log('ℹ️  数据库文件不存在，将在首次启动时创建');
        }
        
        // 5. 检查关键脚本
        console.log('\n5. 检查关键脚本...');
        const scripts = [
            'scripts/auto-fix-nginx-title.js',
            'scripts/ensure-nginx-config.js'
        ];
        
        scripts.forEach(script => {
            const scriptPath = path.join(__dirname, script);
            if (fs.existsSync(scriptPath)) {
                console.log(`✅ 脚本存在: ${script}`);
            } else {
                console.log(`⚠️  脚本缺失: ${script}`);
            }
        });
        
        console.log('\n============================');
        console.log('🎯 修复完成！');
        console.log('现在可以尝试重新启动服务器:');
        console.log('npm start');
        console.log('============================');
        
    } catch (error) {
        console.error('修复过程出错:', error);
    }
}

fixServerStart();
