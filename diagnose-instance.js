import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pm2 from 'pm2';

const execPromise = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * 实例启动问题诊断工具
 */

async function diagnoseInstance(username) {
    console.log('=====================================');
    console.log(`诊断用户 ${username} 的实例启动问题`);
    console.log('=====================================');
    
    try {
        // 1. 检查用户信息
        console.log('\n1. 检查用户信息...');
        const { findUserByUsername } = await import('./database.js');
        const user = findUserByUsername(username);
        
        if (!user) {
            console.error(`❌ 用户 ${username} 不存在`);
            return;
        }
        
        console.log(`✅ 用户信息:`);
        console.log(`   用户名: ${user.username}`);
        console.log(`   端口: ${user.port}`);
        console.log(`   ST目录: ${user.st_dir}`);
        console.log(`   数据目录: ${user.data_dir}`);
        console.log(`   安装状态: ${user.st_setup_status}`);
        
        // 2. 检查SillyTavern目录
        console.log('\n2. 检查SillyTavern目录...');
        if (!fs.existsSync(user.st_dir)) {
            console.error(`❌ SillyTavern目录不存在: ${user.st_dir}`);
            return;
        }
        console.log(`✅ ST目录存在: ${user.st_dir}`);
        
        const serverPath = path.join(user.st_dir, 'server.js');
        if (!fs.existsSync(serverPath)) {
            console.error(`❌ server.js不存在: ${serverPath}`);
            return;
        }
        console.log(`✅ server.js存在: ${serverPath}`);
        
        // 3. 检查package.json
        const packagePath = path.join(user.st_dir, 'package.json');
        if (fs.existsSync(packagePath)) {
            console.log(`✅ package.json存在`);
            try {
                const packageContent = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
                console.log(`   版本: ${packageContent.version || '未知'}`);
                console.log(`   Node.js要求: ${packageContent.engines?.node || '未指定'}`);
            } catch (error) {
                console.warn(`⚠️  无法解析package.json: ${error.message}`);
            }
        } else {
            console.warn(`⚠️  package.json不存在`);
        }
        
        // 4. 检查node_modules
        const nodeModulesPath = path.join(user.st_dir, 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
            console.log(`✅ node_modules存在`);
            
            // 检查关键依赖
            const keyDeps = ['express', 'cors', 'sanitize-filename'];
            for (const dep of keyDeps) {
                const depPath = path.join(nodeModulesPath, dep);
                if (fs.existsSync(depPath)) {
                    console.log(`   ✅ ${dep}: 已安装`);
                } else {
                    console.log(`   ❌ ${dep}: 缺失`);
                }
            }
        } else {
            console.error(`❌ node_modules不存在，需要运行 npm install`);
        }
        
        // 5. 检查端口占用
        console.log('\n3. 检查端口占用...');
        try {
            const netstatCmd = process.platform === 'win32' 
                ? `netstat -ano | findstr :${user.port}` 
                : `lsof -i :${user.port}`;
            
            const { stdout } = await execPromise(netstatCmd);
            if (stdout.trim()) {
                console.log(`⚠️  端口 ${user.port} 可能被占用:`);
                console.log(stdout);
            } else {
                console.log(`✅ 端口 ${user.port} 未被占用`);
            }
        } catch (error) {
            console.log(`✅ 端口 ${user.port} 可能未被占用 (检查命令失败)`);
        }
        
        // 6. 检查PM2状态
        console.log('\n4. 检查PM2状态...');
        try {
            pm2.connect((err) => {
                if (err) {
                    console.error(`❌ PM2连接失败: ${err.message}`);
                    return;
                }
                
                pm2.describe(`st-${username}`, (descErr, processDescription) => {
                    if (descErr) {
                        console.log(`ℹ️  实例不在PM2中运行`);
                    } else if (!processDescription || processDescription.length === 0) {
                        console.log(`ℹ️  实例不存在`);
                    } else {
                        const proc = processDescription[0];
                        console.log(`📊 PM2实例状态:`);
                        console.log(`   状态: ${proc.pm2_env.status}`);
                        console.log(`   PID: ${proc.pid || '无'}`);
                        console.log(`   重启次数: ${proc.pm2_env.restart_time}`);
                        console.log(`   运行时间: ${proc.pm2_env.pm_uptime ? new Date(proc.pm2_env.pm_uptime).toLocaleString() : '未知'}`);
                        console.log(`   CPU: ${proc.monit.cpu}%`);
                        console.log(`   内存: ${(proc.monit.memory / 1024 / 1024).toFixed(2)}MB`);
                    }
                    
                    pm2.disconnect();
                    
                    // 7. 检查日志文件
                    checkLogFiles(username);
                });
            });
        } catch (error) {
            console.error(`❌ PM2检查失败: ${error.message}`);
            checkLogFiles(username);
        }
        
    } catch (error) {
        console.error(`诊断过程中出错: ${error.message}`);
    }
}

function checkLogFiles(username) {
    console.log('\n5. 检查日志文件...');
    
    const errorLogPath = path.join(__dirname, 'logs', `${username}-error.log`);
    const outLogPath = path.join(__dirname, 'logs', `${username}-out.log`);
    
    // 检查错误日志
    if (fs.existsSync(errorLogPath)) {
        const errorContent = fs.readFileSync(errorLogPath, 'utf-8');
        const errorLines = errorContent.split('\n').filter(line => line.trim()).slice(-10);
        
        if (errorLines.length > 0) {
            console.log(`📋 错误日志 (最后10行):`);
            errorLines.forEach(line => {
                console.log(`   ${line}`);
            });
        } else {
            console.log(`✅ 错误日志为空`);
        }
    } else {
        console.log(`ℹ️  错误日志不存在`);
    }
    
    // 检查输出日志
    if (fs.existsSync(outLogPath)) {
        const outContent = fs.readFileSync(outLogPath, 'utf-8');
        const outLines = outContent.split('\n').filter(line => line.trim()).slice(-10);
        
        if (outLines.length > 0) {
            console.log(`📋 输出日志 (最后10行):`);
            outLines.forEach(line => {
                console.log(`   ${line}`);
            });
        } else {
            console.log(`✅ 输出日志为空`);
        }
    } else {
        console.log(`ℹ️  输出日志不存在`);
    }
    
    console.log('\n=====================================');
    console.log('诊断完成');
    console.log('=====================================');
}

// 手动测试启动
async function testManualStart(username) {
    console.log('\n6. 手动测试启动...');
    
    try {
        const { findUserByUsername } = await import('./database.js');
        const user = findUserByUsername(username);
        
        if (!user) {
            console.error(`❌ 用户不存在`);
            return;
        }
        
        const serverPath = path.join(user.st_dir, 'server.js');
        const dataDir = path.join(user.data_dir, 'st-data');
        
        console.log(`尝试手动启动...`);
        console.log(`命令: node "${serverPath}" --port=${user.port} --dataRoot="${dataDir}" --listen`);
        
        const { stdout, stderr } = await execPromise(`node "${serverPath}" --port=${user.port} --dataRoot="${dataDir}" --listen`, {
            cwd: user.st_dir,
            timeout: 10000 // 10秒超时
        });
        
        console.log(`✅ 手动启动成功:`);
        if (stdout) console.log(`输出: ${stdout}`);
        if (stderr) console.log(`错误: ${stderr}`);
        
    } catch (error) {
        console.error(`❌ 手动启动失败:`);
        console.error(`   错误: ${error.message}`);
        if (error.stdout) console.error(`   输出: ${error.stdout}`);
        if (error.stderr) console.error(`   错误输出: ${error.stderr}`);
    }
}

// 获取命令行参数
const username = process.argv[2];

if (!username) {
    console.log('用法: node diagnose-instance.js <用户名>');
    console.log('示例: node diagnose-instance.js 123456');
    process.exit(1);
}

// 执行诊断
diagnoseInstance(username).then(() => {
    return testManualStart(username);
}).catch(error => {
    console.error('诊断失败:', error);
});
