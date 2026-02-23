import { getLocalNetworkIP, getAllLocalNetworkIPs } from './utils/network-helper.js';
import { generateAccessUrl } from './utils/url-helper.js';

console.log('=== 网络IP检测测试 ===');

// 测试获取内网IP
try {
    const localIP = getLocalNetworkIP();
    console.log('主要内网IP:', localIP);
    
    if (!localIP) {
        console.log('❌ 未检测到内网IP');
    } else {
        console.log('✅ 成功检测到内网IP');
    }
} catch (error) {
    console.error('   生成访问地址失败:', error.message);
}

console.log('\n=== 测试完成 ===');
