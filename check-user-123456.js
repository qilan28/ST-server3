import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('检查用户123456的配置和目录...');
console.log('===================================');

async function checkUser() {
    try {
        // 检查数据库中的用户信息
        const { findUserByUsername } = await import('./database.js');
        const user = findUserByUsername('123456');
        
        if (!user) {
            console.error('❌ 用户123456不存在于数据库中');
            return;
        }
        
        console.log('✅ 数据库用户信息:');
        console.log(`   用户名: ${user.username}`);
        console.log(`   端口: ${user.port}`);
        console.log(`   数据目录: ${user.data_dir}`);
        console.log(`   ST目录: ${user.st_dir}`);
        console.log(`   ST版本: ${user.st_version}`);
        console.log(`   安装状态: ${user.st_setup_status}`);
        console.log(`   当前状态: ${user.status}`);
        
        // 检查ST目录是否存在
        if (user.st_dir) {
            if (fs.existsSync(user.st_dir)) {
                console.log('✅ SillyTavern目录存在');
                
                // 检查server.js
                const serverPath = path.join(user.st_dir, 'server.js');
                if (fs.existsSync(serverPath)) {
                    console.log('✅ server.js存在');
                } else {
                    console.error('❌ server.js不存在！');
                }
                
                // 检查package.json
                const packagePath = path.join(user.st_dir, 'package.json');
                if (fs.existsSync(packagePath)) {
                    console.log('✅ package.json存在');
                    try {
                        const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
                        console.log(`   版本: ${pkg.version || '未知'}`);
                    } catch (e) {
                        console.warn('⚠️  无法读取package.json');
                    }
                } else {
                    console.error('❌ package.json不存在！');
                }
                
                // 检查node_modules
                const nodeModulesPath = path.join(user.st_dir, 'node_modules');
                if (fs.existsSync(nodeModulesPath)) {
                    console.log('✅ node_modules存在');
                    
                    // 检查关键依赖
                    const deps = ['express', 'cors', 'sanitize-filename', 'body-parser'];
                    console.log('   关键依赖检查:');
                    deps.forEach(dep => {
                        const depPath = path.join(nodeModulesPath, dep);
                        if (fs.existsSync(depPath)) {
                            console.log(`   ✅ ${dep}`);
                        } else {
                            console.log(`   ❌ ${dep} 缺失`);
                        }
                    });
                } else {
                    console.error('❌ node_modules不存在！需要运行 npm install');
                }
            } else {
                console.error('❌ SillyTavern目录不存在！');
            }
        } else {
            console.error('❌ 用户未设置ST目录！');
        }
        
        // 检查数据目录
        if (user.data_dir) {
            if (fs.existsSync(user.data_dir)) {
                console.log('✅ 用户数据目录存在');
                
                const stDataDir = path.join(user.data_dir, 'st-data');
                if (fs.existsSync(stDataDir)) {
                    console.log('✅ ST数据目录存在');
                } else {
                    console.log('⚠️  ST数据目录不存在，将在启动时创建');
                }
            } else {
                console.error('❌ 用户数据目录不存在！');
            }
        }
        
        console.log('\n=== 建议的解决方案 ===');
        
        if (!user.st_dir || !fs.existsSync(user.st_dir)) {
            console.log('🔧 问题: SillyTavern未安装或目录丢失');
            console.log('   解决方案: 重新安装SillyTavern');
            console.log('   1. 登录管理面板');
            console.log('   2. 点击"版本管理"');
            console.log('   3. 选择版本重新安装');
        } else if (!fs.existsSync(path.join(user.st_dir, 'node_modules'))) {
            console.log('🔧 问题: 依赖未安装');
            console.log('   解决方案: 重新安装依赖');
            console.log(`   在目录 ${user.st_dir} 中运行: npm install`);
        } else {
            console.log('🔧 可能的问题: 启动参数或配置问题');
            console.log('   解决方案:');
            console.log('   1. 运行 quick-fix-instances.bat');
            console.log('   2. 或手动重启PM2: pm2 kill && npm start');
            console.log('   3. 检查端口冲突');
        }
        
    } catch (error) {
        console.error('检查过程出错:', error.message);
    }
}

checkUser();
