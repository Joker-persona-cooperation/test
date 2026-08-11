# 前端部署

前端使用 GitHub Actions 构建后发布静态文件，服务器只需要 Nginx，不需要安装 Node.js。

## 服务器首次准备

在运行后端的服务器上执行：

```bash
sudo mkdir -p /www/wwwroot/dev.taskpilot.1kuansi.cn/taskpilot-web/releases
sudo chown -R "$USER":"$USER" /www/wwwroot/dev.taskpilot.1kuansi.cn/taskpilot-web
```

将 `deploy/nginx.taskpilot.conf` 安装到 Nginx 站点目录。配置中的后端地址必须与服务器实际端口一致：当前开发 Compose 的 API 映射为 `127.0.0.1:8889`；如果服务器使用生产 Compose（API 映射为 `127.0.0.1:8888`），将 `proxy_pass` 改为 `http://127.0.0.1:8888`。

后端仓库位于 `/www/wwwroot/dev.taskpilot.1kuansi.cn/taskpilot-dev-server`，当前开发 Compose 的 API 应通过 `127.0.0.1:8889` 提供服务。服务器目录名不决定公网域名；仍需为 `taskpilot.1kuansi.cn` 配置 DNS A/AAAA 记录并签发证书，再执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

## GitHub Actions Secrets

在前端仓库配置以下 Secrets：

| Secret | 示例 |
| --- | --- |
| `WEB_DEPLOY_HOST` | 服务器公网 IP 或 SSH 主机名（不要填网站域名） |
| `WEB_DEPLOY_PORT` | SSH 端口，通常为 `22` |
| `WEB_DEPLOY_USER` | 能 SSH 登录并写入前端目录的用户 |
| `WEB_DEPLOY_SSH_KEY` | 对应用户的私钥（完整 PEM/OpenSSH 内容） |
| `WEB_DEPLOY_PATH` | `/www/wwwroot/dev.taskpilot.1kuansi.cn/taskpilot-web` |

推送到 `main` 后，工作流会执行 `npm ci`、`npm run build`，上传 `dist`，并将 `current` 原子切换到新版本，同时保留最近 5 个发布版本。Pull Request 只执行构建，不会连接服务器。

## 发布后验证

```bash
curl -fsSI https://taskpilot.1kuansi.cn/
curl -fsSI https://taskpilot.1kuansi.cn/login
```

浏览器开发者工具中的业务请求应为同源的 `/api/v1/...`。如果页面能打开但接口返回 502，优先检查 Nginx `proxy_pass` 端口；如果接口返回 CORS 或 Cookie 错误，检查后端 `TASKPILOT_CORS_ALLOWED_ORIGINS` 是否包含 `https://taskpilot.1kuansi.cn`，并确认 HTTPS 环境启用了 `TASKPILOT_AUTH_COOKIE_SECURE=true`。

回滚时把 `current` 指向任意旧发布目录并 reload Nginx：

```bash
ln -sfn /www/wwwroot/dev.taskpilot.1kuansi.cn/taskpilot-web/releases/<release-id> /www/wwwroot/dev.taskpilot.1kuansi.cn/taskpilot-web/current
sudo nginx -t && sudo systemctl reload nginx
```
