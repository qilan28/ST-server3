import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 用户123456紧急修复脚本
 * 解决重启93次的死循环问题
 */

console.log('🚨 用户123456紧急修复脚本');
console.log('============================');

async function emergencyFix() {
    try {
        // 1. 立即停止PM2中的所有st-123456进程
        console.log('\n1. 停止问题进程...');
        try {
            await execPromise('pm2 stop st-123456');
            console.log('✅ 已停止 st-123456');
        } catch (error) {
            console.log('ℹ️  进程可能已停止');
        }
        
        try {
            await execPromise('pm2 delete st-123456');
            console.log('✅ 已删除 st-123456');
        } catch (error) {
            console.log('ℹ️  进程可能不存在');
        }
        
        // 2. 创建必要的目录
        console.log('\n2. 创建必要目录...');
        const logsDir = path.join(__dirname, 'logs');
        if (!fs.existsSync(logsDir)) {
            fs.mkdirSync(logsDir, { recursive: true });
            console.log('✅ 创建日志目录');
        }
        
        // 3. 检查用户配置
        console.log('\n3. 检查用户配置...');
        const { findUserByUsername, updateUserStatus } = await import('./database.js');
        const user = findUserByUsername('123456');
        
        if (!user) {
            console.error('❌ 用户123456不存在');
            return;
        }
        
        console.log('✅ 用户信息:');
        console.log(`   端口: ${user.port}`);
        console.log(`   ST目录: ${user.st_dir}`);
        console.log(`   安装状态: ${user.st_setup_status}`);
        
        // 4. 重置用户状态
        console.log('\n4. 重置用户状态...');
        updateUserStatus('123456', 'stopped');
        console.log('✅ 用户状态已重置为停止');
        
        // 5. 检查SillyTavern目录和文件
        if (user.st_dir && fs.existsSync(user.st_dir)) {
            console.log('\n5. 检查SillyTavern文件...');
            
            const serverPath = path.join(user.st_dir, 'server.js');
            if (!fs.existsSync(serverPath)) {
                console.error('❌ server.js不存在，需要重新安装SillyTavern');
                console.log('解决方案：登录管理面板 → 版本管理 → 重新安装');
                return;
            }
            
            const nodeModulesPath = path.join(user.st_dir, 'node_modules');
            if (!fs.existsSync(nodeModulesPath)) {
                console.error('❌ node_modules不存在，需要安装依赖');
                console.log(`解决方案：在目录 ${user.st_dir} 中运行 npm install`);
                return;
            }
            
            console.log('✅ 基本文件存在');
            
            // 6. 尝试手动测试启动
            console.log('\n6. 测试手动启动...');
            const dataDir = path.join(user.data_dir, 'st-data');
            
            // 确保数据目录存在
            if (!fs.existsSync(dataDir)) {
                fs.mkdirSync(dataDir, { recursive: true });
                console.log('✅ 创建数据目录');
            }
            
            try {
                console.log(`正在测试: node "${serverPath}" --port=${user.port} --dataRoot="${dataDir}" --listen`);
                
                // 使用较短的超时时间测试
                const { stdout, stderr } = await execPromise(
                    `node "${serverPath}" --port=${user.port} --dataRoot="${dataDir}" --listen`,
                    {
                        cwd: user.st_dir,
                        timeout: 5000, // 5秒超时
                        env: {
                            ...process.env,
                            NODE_ENV: 'production',
                            PORT: user.port.toString()
                        }
                    }
                );
                
                console.log('⚠️  启动测试超时（这可能是正常的，说明进程在运行）');
                
            } catch (error) {
                console.error('❌ 手动启动测试失败:');
                console.error('   错误:', error.message);
                
                if (error.stdout) {
                    console.error('   输出:', error.stdout);
                }
                if (error.stderr) {
                    console.error('   错误输出:', error.stderr);
                    
                    // 分析常见错误
                    if (error.stderr.includes('EADDRINUSE')) {
                        console.log('🔧 诊断：端口被占用');
                        console.log('   解决方案：重启服务器或使用不同端口');
                    } else if (error.stderr.includes('Cannot find module')) {
                        console.log('🔧 诊断：缺少模块');
                        console.log('   解决方案：重新安装依赖 npm install');
                    } else if (error.stderr.includes('SyntaxError')) {
                        console.log('🔧 诊断：代码语法错误');
                        console.log('   解决方案：重新安装SillyTavern');
                    }
                }
            }
        } else {
            console.error('❌ SillyTavern目录不存在或未配置');
            console.log('解决方案：登录管理面板 → 版本管理 → 安装SillyTavern');
        }
        
        console.log('\n============================');
        console.log('🎯 修复建议：');
        console.log('1. 重新安装SillyTavern（推荐）');
        console.log('2. 如果问题仍存在，检查Node.js版本');
        console.log('3. 重启整个服务器');
        console.log('============================');
        
    } catch (error) {
        console.error('修复过程出错:', error);
    }
}

emergencyFix();
