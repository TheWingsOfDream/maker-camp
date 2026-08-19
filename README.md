# 共享留言墙 · Shared Wall

一个**零外部依赖数据库**、可跨平台（同局域网手机/电脑直接访问）的留言板网页应用。
后端 Flask 单进程 + 前端原生 HTML/JS，留言数据存为本地 JSON 文件。

## 目录结构

```
shared-wall/
├── app.py              # Flask 入口：创建 app、关闭 ascii 转义、注册路由、启动
├── config.py           # 服务器与数据路径配置（HOST / PORT / DEBUG / DATA_FILE）
├── db.py               # 数据层：JSON 文件读写 + 原子写 + 写锁 + 并发重试
├── routes.py           # 路由与接口（GET/POST/DELETE）
├── templates/
│   └── index.html      # 前端页面
├── static/
│   ├── script.js       # 前端逻辑
│   └── style.css       # 前端样式
├── data/
│   └── cards.json      # 留言数据（运行时自动生成，初次为空 []）
└── refrence/           # 主题设计规范等参考资料
```

## 启动方式

```bash
# 1. 安装依赖（仅需 Flask）
pip install flask

# 2. 启动服务（在项目根目录执行）
python app.py

# 3. 访问
#    本机浏览器：  http://127.0.0.1:5001/
#    同一局域网内其他设备（手机/电脑）：
#                  http://<本机局域网 IP>:5001/
#                  查看本机 IP：Windows 用 `ipconfig`，macOS/Linux 用 `ifconfig` 或 `hostname -I`
```

> 服务器监听 `0.0.0.0:5001`，`DEBUG=False`。
> 停止服务：`Stop-Process -Name python`（Windows）或直接 `Ctrl+C`。

## 接口一览

| 方法 | 路径 | 说明 |
|------|------|------|
| GET  | `/api/cards` | 获取全部留言（按时间倒序，新的在前） |
| POST | `/api/cards` | 新增留言，请求体 `{"text": "内容"}`，单条 ≤ 200 字，返回 201 |
| DELETE | `/api/cards/<id>` | 按 id 删除一条留言，成功返回 `{"ok": true}` |

## 备注

- 数据持久化在 `data/cards.json`，无需任何数据库服务，便于跨平台拷贝部署。
- 当前删除接口仅凭 id 即可操作，公网暴露前建议加简单防护（见代码注释）。
