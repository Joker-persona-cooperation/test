项目简介
TaskPilot 是一款 AI 任务拆解工具，用户上传 PDF 文件或粘贴文本内容，后端 AI 自动提取文档内标题、截止时间、交付物、关键要求、风险提醒、任务清单，结构化输出后可保存为项目并可视化管理任务看板。
前端核心业务链路：
登录 → 上传文档/粘贴文本 → 查看AI解析状态 → 编辑结构化解析结果 → 保存项目 → 任务看板管理
配套后端仓库：taskpilot-server
技术栈
核心框架：Vue 3 + Vite + TypeScript
路由：Vue Router
状态管理：Pinia
HTTP 请求：Axios
UI 组件库：Element Plus
样式：Sass / CSS Variables
工具库：Day.js（日期格式化）
仓库目录结构
taskpilot-web/
├── public/                # 静态资源
├── src/
│   ├── api/               # 所有接口请求封装（按业务模块拆分）
│   ├── assets/            # 图片、图标静态资源
│   ├── components/        # 通用/业务组件（按业务域分文件夹）
│   │   ├── common/        # 全局通用组件
│   │   ├── auth/          # 登录注册组件
│   │   ├── parse/         # 文档解析模块组件
│   │   ├── project/       # 项目任务看板组件
│   │   └── history/       # 历史记录组件
│   ├── composables/       # 组合式复用逻辑
│   ├── layouts/           # 页面布局模板
│   ├── router/            # 路由配置、路由守卫
│   ├── stores/            # Pinia 全局状态
│   ├── styles/            # 全局样式、主题变量、重置样式
│   ├── types/             # TS 全局类型定义
│   ├── utils/             # 工具函数、请求封装、存储、格式化
│   ├── views/             # 页面视图（一一对应路由）
│   ├── App.vue
│   └── main.ts
├── .env.development       # 开发环境变量
├── .env.production        # 生产环境变量
├── vite.config.ts
├── tsconfig.json
└── package.json
页面路由清单
/login          登录页
/register       注册页
/dashboard      工作台首页
/parse/new      新建解析（上传/粘贴文本）
/parse/:id      解析结果详情编辑页
/projects       项目列表
/projects/:id   项目详情+任务看板
/history        历史解析记录
/profile        个人中心
快速启动
1. 克隆仓库
git clone https://github.com/xxx/taskpilot-web.git
cd taskpilot-web
2. 安装依赖
npm install
3. 本地开发
npm run dev
4. 打包构建
npm run build
5. 预览打包产物
npm run preview
环境变量配置
.env.development（本地开发）
VITE_APP_TITLE=TaskPilot
VITE_API_BASE_URL=http://localhost:8888/api/v1
.env.production（线上环境）
VITE_APP_TITLE=TaskPilot
VITE_API_BASE_URL=https://api.yourdomain.com/api/v1
核心业务模块说明
1. 账号模块
登录 / 注册表单、Token 持久化
路由守卫鉴权，未登录自动跳转登录页
个人信息查看、昵称修改、退出登录
2. 文档 AI 解析模块
PDF 文件拖拽上传 / 纯文本粘贴双模式
解析任务创建、状态轮询（解析中 / 成功 / 失败）
AI 结构化结果可视化编辑：
文档摘要、截止时间、关键要求、风险提醒、交付物、任务清单
3. 项目 & 任务管理模块
将解析结果一键保存为独立项目
项目列表筛选、项目基础信息展示
拖拽式任务看板（多列任务状态泳道）
新增 / 编辑 / 删除任务、修改任务状态
4. 历史记录模块
展示全部历史解析记录
标记是否已生成项目
快速回跳解析详情页二次编辑
开发规范
目录设计原则
views/：仅页面容器，负责路由、请求、组装子组件
components/：复用组件，按业务域拆分，不全部堆 common
api/：接口统一封装，禁止页面内直接写 axios
stores/：仅存放跨页面全局状态，局部状态放组件内
types/：所有接口、业务模型统一 TS 类型定义
utils/：纯工具函数，无业务耦合
样式规范
主色调：#38a5ff，统一 CSS Variables 主题变量
整体清爽商务风，轻阴影、统一圆角、规范间距
全局 scss 变量统一管理颜色、间距、阴影
状态管理规范
Pinia 拆分 5 个核心仓库：
auth.ts：登录态、Token、登录退出逻辑
user.ts：当前用户基础信息
upload.ts：上传文件、解析任务状态
parse.ts：当前编辑的 AI 解析结构化数据
project.ts：当前项目、任务列表数据
开发推进顺序（MVP）
基础设施：项目初始化、路由 / Pinia/Axios 封装、全局布局样式
账号体系：登录、注册、路由鉴权、用户信息
AI 解析主链路：上传、任务轮询、解析结果编辑页
项目任务模块：保存项目、项目列表、任务看板
收尾优化：历史记录、个人中心、空状态、加载态、异常处理
MVP 交付验收功能
用户注册、登录、个人信息管理
PDF 上传 / 文本粘贴创建 AI 解析任务
实时查看解析进度与失败重试
可视化编辑 AI 提取的全部结构化文档信息
解析结果保存为独立项目
项目看板管理任务（增删改、状态切换）
查看全部历史解析记录
常见开发注意事项
禁止将所有局部状态存入 Pinia，仅共享全局数据
页面与组件分层解耦，单个页面文件不宜过长
所有接口请求统一封装至 api 文件夹，杜绝重复 axios 代码
每个接口必须处理 loading、成功、失败三种状态，完善空页面、加载占位
配套文档
前端开发规范文档：taskpilot-frontend-dev-guide.md
后端仓库：taskpilot-server