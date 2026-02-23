import { findUserByUsername } from './database.js';
import fs from 'fs';

// 测试：检查用户ST目录是否存在的逻辑
console.log('=== ST目录检查逻辑测试 ===');

// 假设一个测试用户名（你需要根据实际情况修改）
const testUsername = '123456';  // 从图片中看到的用户名

try {
    // 查找用户
    const user = findUserByUsername(testUsername);
    
    if (!user) {
        console.log(`❌ 用户 ${testUsername} 不存在`);
    } else {
        console.log(`✅ 找到用户: ${user.username}`);
        console.log(`   ST目录: ${user.st_dir}`);
        console.log(`   当前状态: ${user.st_setup_status}`);
        
        // 检查目录是否存在
        if (user.st_dir) {
            const exists = fs.existsSync(user.st_dir);
            console.log(`   目录存在: ${exists ? '✅' : '❌'}`);
            
            if (!exists && user.st_setup_status === 'completed') {
                console.log('   🔍 检测到问题：状态是completed但目录不存在');
                console.log('   📝 在实际API调用中会自动更新状态为failed');
            }
        } else {
            console.log('   ❌ 未设置ST目录');
        }
    }
    
} catch (error) {
    console.error('❌ 测试失败:', error.message);
}

console.log('\n=== 修复功能说明 ===');
console.log('1. API检查：用户信息接口会自动检查ST目录是否存在');
console.log('2. 状态更新：如果目录不存在但状态是completed，自动更新为failed');
console.log('3. 前端提示：控制台页面会显示警告和重新安装按钮');
console.log('4. 错误处理：启动/重启失败时会引导用户重新安装');
console.log('5. 按钮控制：目录不存在时禁用启动和重启按钮');
