@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

:: StoryCoe Miniapp 推送到 GitHub 脚本
:: 用法: 双击运行 或 命令行: push_to_github.bat "提交信息"

:: 切换到脚本所在目录
cd /d "%~dp0"

cls
echo ==========================================
echo StoryCoe Miniapp 推送到 GitHub
echo ==========================================

:: 检查是否输入提交信息
if "%~1"=="" (
    echo.
    echo 用法: push_to_github.bat "提交信息"
    echo 示例: push_to_github.bat "fix: 修复某个bug"
    echo.
    pause
    exit /b 1
)

set "COMMIT_MSG=%~1"

:: 检查是否有更改
git status --porcelain | findstr . >nul
if !errorlevel! equ 1 (
    echo.
    echo 没有需要提交的更改
    echo.
    pause
    exit /b 0
)

:: 显示更改
echo.
echo 待提交的更改:
git status --short
echo.

:: 添加所有文件
git add -A

:: 提交
echo 提交: %COMMIT_MSG%
git commit -m "%COMMIT_MSG%"

:: 推送
echo.
echo 推送到 GitHub...
git push origin master

:: 结果判断
if %errorlevel% equ 0 (
    echo.
    echo ==========================================
    echo ✓ 推送成功！
    echo ==========================================
    echo 仓库地址: https://github.com/cnzhangsheng/storycoe_miniapp
) else (
    echo.
    echo ==========================================
    echo ✗ 推送失败，请检查网络连接
    echo ==========================================
)

echo.
pause
exit /b