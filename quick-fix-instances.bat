@echo off
chcp 65001 >nul
echo ===============================================
echo         SillyTavern 实例启动问题快速修复
echo ===============================================
echo.

echo [1/4] 正在检查 Node.js 版本...
node --version
if %ERRORLEVEL% NEQ 0 (
    echo ❌ Node.js 未安装或版本不兼容
    echo    请安装 Node.js v20.11.0 或更高版本
    pause
    exit /b 1
)
echo ✅ Node.js 版本检查通过

echo.
echo [2/4] 正在停止所有 SillyTavern 实例...
pm2 stop all 2>nul
pm2 delete all 2>nul
pm2 kill 2>nul
echo ✅ PM2 进程已清理

echo.
echo [3/4] 正在运行实例修复工具...
node reset-instances.js
if %ERRORLEVEL% NEQ 0 (
    echo ❌ 修复工具运行失败
    echo    请检查错误信息或联系管理员
    pause
    exit /b 1
)
echo ✅ 实例修复工具运行完成

echo.
echo [4/4] 正在重启服务器...
echo 3秒后自动重启服务器，或按任意键立即重启...
timeout /t 3 /nobreak >nul
echo.
echo ===============================================
echo                修复完成！
echo         正在启动 SillyTavern 服务器...
echo ===============================================
echo.

start cmd /c "node server.js"

echo ✅ 服务器已启动
echo    请等待几秒钟后访问管理面板
echo    如果问题仍然存在，请查看 INSTANCE-TROUBLESHOOTING.md
echo.
pause
