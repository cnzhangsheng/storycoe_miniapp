#!/bin/bash

# StoryCoe Miniapp 推送到 GitHub 脚本
# 用法: ./push_to_github.sh "提交信息"

cd "$(dirname "$0")"

# 检查是否有参数
if [ -z "$1" ]; then
    echo "用法: ./push_to_github.sh \"提交信息\""
    echo "示例: ./push_to_github.sh \"fix: 修复某个bug\""
    exit 1
fi

COMMIT_MSG="$1"

echo "=========================================="
echo "StoryCoe Miniapp 推送到 GitHub"
echo "=========================================="

# 检查是否有更改
if [ -z "$(git status --porcelain)" ]; then
    echo "没有需要提交的更改"
    exit 0
fi

# 显示更改
echo "待提交的更改:"
git status --short
echo ""

# 添加所有更改
git add -A

# 提交
echo "提交: $COMMIT_MSG"
git commit -m "$COMMIT_MSG"

# 推送
echo ""
echo "推送到 GitHub..."
git push origin master

if [ $? -eq 0 ]; then
    echo ""
    echo "=========================================="
    echo "✓ 推送成功！"
    echo "=========================================="
    echo "仓库地址: https://github.com/cnzhangsheng/storycoe_miniapp"
else
    echo ""
    echo "=========================================="
    echo "✗ 推送失败，请检查网络连接"
    echo "=========================================="
fi
