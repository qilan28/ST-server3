import { getNginxConfig } from './config-manager.js';
import { getForwardingConfig, getAllForwardingServers } from '../database-instance-forwarding.js';
import { getLocalNetworkIP } from './network-helper.js';

/**
 * 生成用户的 SillyTavern 访问地址
 * @param {string} username - 用户名
 * @param {number} port - 用户端口
 * @returns {Object} 包含主访问地址和备用访问地址列表
 */
export function generateAccessUrl(username, port) {
    let mainUrl = ''; // 主访问地址
    let alternativeUrls = []; // 备用访问地址列表
    
    // 首先设置主地址为 Nginx 配置
    const nginxConfig = getNginxConfig();
    
    if (nginxConfig.enabled) {
        // Nginx 路径转发模式：http://域名:端口/用户名/st/
        const portPart = nginxConfig.port === 80 ? '' : `:${nginxConfig.port}`;
        mainUrl = `http://${nginxConfig.domain}${portPart}/${username}/st/`;
    } else {
        // 直接端口模式：http://localhost:端口
        mainUrl = `http://localhost:${port}`;
    }
    
    // 添加内网IP访问地址 - 内网访问始终使用用户的直接端口
    try {
        const localIP = getLocalNetworkIP();
        if (localIP) {
            // 内网访问直接使用用户端口，不通过 Nginx 代理
            const localUrl = `http://${localIP}:${port}`;
            
            alternativeUrls.push({
                url: localUrl,
                isActive: true,
                type: 'local-network',
                label: '内网访问'
            });
        }
    } catch (error) {
        console.error('获取内网IP失败:', error.message);
    }
    
    // 获取转发服务器地址作为备用地址，仅用于显示
    try {
        // 获取所有转发服务器列表，包括非活跃的
        const servers = getAllForwardingServers();
        
        // 如果有服务器，生成备用地址
        if (servers && servers.length > 0) {
            servers.forEach(server => {
                // 生成备用地址的URL，使用服务器自身的端口
                const hasProtocol = /^https?:\/\//i.test(server.address);
                const address = hasProtocol ? server.address : `http://${server.address}`;
                const backupUrl = `${address}:${server.port}/${username}/st/`;
                
                // 添加到备用地址列表，带上服务器状态信息
                alternativeUrls.push({
                    url: backupUrl,
                    isActive: server.is_active === 1,
                    serverId: server.id,
                    type: 'forwarding-server',
                    label: '转发服务器'
                });
            });
        }
    } catch (error) {
        console.error('获取转发服务器失败:', error.message);
    }
    
    // 返回主访问地址和备用地址列表
    return {
        mainUrl,
        alternativeUrls
    };
}

/**
 * 获取管理平台访问地址
 * @returns {string} 访问地址
 */
export function getManagerUrl() {
    const PORT = process.env.PORT || 3000;
    const nginxConfig = getNginxConfig();
    
    if (nginxConfig.enabled) {
        const portPart = nginxConfig.port === 80 ? '' : `:${nginxConfig.port}`;
        return `http://${nginxConfig.domain}${portPart}`;
    } else {
        return `http://localhost:${PORT}`;
    }
}

/**
 * 检查是否使用 Nginx 模式
 * @returns {boolean}
 */
export function isUsingNginx() {
    const nginxConfig = getNginxConfig();
    return nginxConfig.enabled;
}
