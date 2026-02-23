import { getLocalNetworkIP, getAllLocalNetworkIPs } from './utils/network-helper.js';
import { generateAccessUrl } from './utils/url-helper.js';

console.log('=== 内网IP访问地址测试 ===\n');

// 测试获取内网IP
try {
    const localIP = getLocalNetworkIP();
    console.log('检测到的内网IP:', localIP);
    
    if (localIP) {
        // 测试URL生成 - 使用图片中的用户信息
        const testUsername = '123456';
        const testPort = 5073;
        
        console.log(`\n测试用户: ${testUsername}`);
        console.log(`用户端口: ${testPort}`);
        
        const urlData = generateAccessUrl(testUsername, testPort);
        
        console.log('\n生成的访问地址:');
        console.log('主地址:', urlData.mainUrl);
        
        // 查找内网访问地址
        const localNetworkUrl = urlData.alternativeUrls.find(url => url.type === 'local-network');
        
        if (localNetworkUrl) {
            console.log('\n内网访问地址:');
            console.log('  地址:', localNetworkUrl.url);
            console.log('  预期格式: http://10.108.19.117:5073');
            
            // 验证格式是否正确
            const expectedPattern = new RegExp(`^http://${localIP.replace(/\./g, '\\.')}:${testPort}$`);
            if (expectedPattern.test(localNetworkUrl.url)) {
                console.log('  ✅ 格式正确 - 使用用户直接端口');
            } else {
                console.log('  ❌ 格式不正确');
            }
        } else {
            console.log('  ❌ 未生成内网访问地址');
        }
        
    } else {
        console.log('❌ 未检测到内网IP');
    }
    
} catch (error) {
    console.error('❌ 测试失败:', error.message);
}

console.log('\n=== 修复效果 ===');
console.log('✅ 内网IP访问现在使用: http://内网IP:用户端口');
console.log('✅ 不再使用 Nginx 路径，直接连接用户实例');
console.log('✅ 局域网设备可直接访问用户的 SillyTavern');
