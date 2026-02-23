import { networkInterfaces } from 'os';

/**
 * 获取本机内网IP地址
 * @returns {string|null} 内网IP地址，找不到时返回null
 */
export function getLocalNetworkIP() {
    try {
        const interfaces = networkInterfaces();
        
        // 遍历所有网络接口
        for (const [name, addresses] of Object.entries(interfaces)) {
            if (!addresses) continue;
            
            // 跳过虚拟接口和回环接口
            const skipInterfaces = ['lo', 'loopback', 'docker', 'veth', 'br-', 'vmware', 'virtualbox'];
            if (skipInterfaces.some(skip => name.toLowerCase().includes(skip))) {
                continue;
            }
            
            // 查找IPv4内网地址
            for (const addr of addresses) {
                // 必须是IPv4，非内部地址，且是内网地址
                if (addr.family === 'IPv4' && !addr.internal && isPrivateIP(addr.address)) {
                    console.log(`[Network] 检测到内网IP: ${addr.address} (接口: ${name})`);
                    return addr.address;
                }
            }
        }
        
        console.warn('[Network] 未找到有效的内网IP地址');
        return null;
    } catch (error) {
        console.error('[Network] 获取内网IP失败:', error);
        return null;
    }
}

/**
 * 判断是否为内网IP地址
 * @param {string} ip - IP地址
 * @returns {boolean} 是否为内网IP
 */
function isPrivateIP(ip) {
    const parts = ip.split('.').map(Number);
    
    // 检查IP格式
    if (parts.length !== 4 || parts.some(part => isNaN(part) || part < 0 || part > 255)) {
        return false;
    }
    
    const [a, b] = parts;
    
    // 10.0.0.0/8
    if (a === 10) return true;
    
    // 172.16.0.0/12
    if (a === 172 && b >= 16 && b <= 31) return true;
    
    // 192.168.0.0/16
    if (a === 192 && b === 168) return true;
    
    return false;
}

/**
 * 获取所有可用的内网IP地址
 * @returns {Array<{ip: string, interface: string}>} 内网IP列表
 */
export function getAllLocalNetworkIPs() {
    try {
        const interfaces = networkInterfaces();
        const localIPs = [];
        
        // 遍历所有网络接口
        for (const [name, addresses] of Object.entries(interfaces)) {
            if (!addresses) continue;
            
            // 跳过虚拟接口和回环接口
            const skipInterfaces = ['lo', 'loopback', 'docker', 'veth', 'br-', 'vmware', 'virtualbox'];
            if (skipInterfaces.some(skip => name.toLowerCase().includes(skip))) {
                continue;
            }
            
            // 查找IPv4内网地址
            for (const addr of addresses) {
                // 必须是IPv4，非内部地址，且是内网地址
                if (addr.family === 'IPv4' && !addr.internal && isPrivateIP(addr.address)) {
                    localIPs.push({
                        ip: addr.address,
                        interface: name
                    });
                }
            }
        }
        
        return localIPs;
    } catch (error) {
        console.error('[Network] 获取所有内网IP失败:', error);
        return [];
    }
}
