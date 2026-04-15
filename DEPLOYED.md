# Backend Admin System — Setup Complete ✅

## 已完成的配置

### 1. Cloudflare D1 数据库
- 数据库名：`ndf-lending-db`
- 数据库 ID：`f127c66b-d115-4d0b-a143-8decf6b6be4b`
- 区域：WNAM (West North America)

### 2. 数据库表结构
已创建 5 个表：
- `leads` - 客户线索
- `visits` - 访客记录
- `news` - 新闻文章
- `loan_knowledge` - 贷款知识库
- `calculator_analytics` - 计算器使用统计

### 3. Cloudflare Pages Functions API
- 位置：`/functions/api/[[path]].js`
- API 端点：
  - `POST /api/leads` - 提交客户表单
  - `GET /api/leads` - 获取所有线索
  - `PUT /api/leads/:id` - 更新线索状态
  - `POST /api/visits` - 记录访客
  - `GET /api/visits` - 获取访客记录
  - `GET /api/news` - 获取新闻
  - `POST /api/news` - 创建新闻
  - `PUT /api/news/:id` - 更新新闻
  - `DELETE /api/news/:id` - 删除新闻
  - `GET /api/knowledge` - 获取知识库文章
  - `POST /api/knowledge` - 创建文章
  - `PUT /api/knowledge/:id` - 更新文章
  - `DELETE /api/knowledge/:id` - 删除文章
  - `GET /api/analytics` - 获取计算器使用统计
  - `POST /api/analytics` - 记录计算器使用

### 4. 已部署文件
- `index.html` - 主网站（已添加访客追踪和表单提交）
- `calculator.html` - 计算器（已添加使用追踪）
- `admin.html` - 管理后台（密码：`david2025!`）
- `functions/api/[[path]].js` - API 后端

## 访问方式

- **主网站**: https://www.loaninca.com/index.html
- **计算器**: https://www.loaninca.com/calculator.html
- **管理后台**: https://www.loaninca.com/admin.html
  - 密码：`david2025!`

## 功能说明

### 1. 客户线索管理
- 自动记录所有提交的咨询表单
- 按状态筛选（新线索/已联系/已确认/已成交）
- 搜索功能（姓名/电话/类型）
- 导出 CSV
- 添加内部备注

### 2. 访客统计
- 实时访客计数
- 7 天访客趋势图
- 页面级追踪
- UTM 来源追踪（小红书等）

### 3. 计算器使用统计
- 追踪每个计算器的使用次数
- 记录输入输出数据（匿名）
- 按日/周统计

### 4. 新闻管理
- 创建/编辑/删除新闻
- 中英文双语支持
- 分类：新闻/推广/公告
- 发布/取消发布

### 5. 贷款知识库
- 创建教育内容
- FAQ 管理
- 标签系统
- 浏览次数统计

## 下一步操作（可选）

### 更改管理员密码
编辑 `admin.html` 第 9 行：
```javascript
window.ADMIN_PASSWORD = 'your_new_password';
```

### 添加更多管理员
目前只有一个密码保护。如需多用户支持，可升级使用 Cloudflare Access。

### 查看数据库内容
```bash
wrangler d1 execute ndf-lending-db --remote --command "SELECT * FROM leads"
```

### 监控 API 使用情况
在 Cloudflare Dashboard → Workers & Pages → loaninca → Functions 查看

## 故障排除

### API 返回 404
确保 `functions/api/[[path]].js` 文件存在于部署中。

### 数据库查询失败
检查 D1 数据库绑定是否正确：
```bash
wrangler d1 execute ndf-lending-db --remote --command ".tables"
```

### 表单提交不工作
检查浏览器控制台是否有错误，确保 API 端点可访问。
