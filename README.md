# MySkills

> Claude Code Skill Manager - 一个用于管理 Claude Code 技能(Skills)的桌面应用

![MySkills](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Electron](https://img.shields.io/badge/Electron-28.0.0-9FE349.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## 功能特性

- 📂 **多路径扫描** - 支持扫描多个技能目录
- 🏷️ **来源标识** - 自动识别技能来源 (ClaudeCode/Cursor/CodeBuddy)
- 📦 **版本管理** - 基于 Git 的语义化版本管理
- 🔄 **远程同步** - 支持 GitHub/GitLab/Gitee 远程仓库同步
- 📜 **版本历史** - 查看提交历史和版本回退
- 🔍 **差异对比** - 可视化查看版本间的代码差异
- ⚡ **批量操作** - 批量初始化、提交、更新技能

## 截图

<img width="1712" height="673" alt="image" src="https://github.com/user-attachments/assets/ba4e9724-b8a8-44c1-bdc1-95338da68926" />


## 安装

### 从 GitHub Release 下载

1. 前往 [Releases](https://github.com/lingcSun/MySkills/releases) 页面
2. 下载最新的安装包 `MySkills-Setup-x.x.x.exe`
3. 运行安装程序

### 从源码运行

```bash
# 克隆仓库
git clone https://github.com/lingcSun/MySkills.git
cd MySkills

# 安装依赖
npm install

# 启动应用
npm start
```

### 打包

```bash
npm run build
```

打包后的安装包位于 `dist/` 目录。

## 使用说明

### 配置技能路径

首次启动后，点击"设置"标签，配置你的技能扫描路径：

```
C:\Users\你的用户名\.claude\skills
E:\你的项目\.claude\skills
```

### 来源配置

配置路径前缀以自动识别技能来源：

- **ClaudeCode** - Claude Code 的技能目录
- **Cursor** - Cursor AI 的技能目录  
- **CodeBuddy** - 其他 AI 工具的技能目录

### 版本管理

1. **初始化版本** - 点击"初始化版本"按钮，为技能创建 Git 仓库
2. **提交版本** - 修改技能后，选择版本类型 (Patch/Minor/Major) 并提交
3. **查看历史** - 点击"历史"按钮查看版本记录
4. **回退版本** - 选择历史版本并恢复

### 远程同步

1. **关联仓库** - 点击"关联远程"，输入 GitHub/GitLab/Gitee 仓库地址
2. **检查更新** - 查看远程仓库是否有新版本
3. **拉取更新** - 选择合并策略 (保留本地修改 或 覆盖本地修改)

## 技术栈

- **Electron** - 跨平台桌面应用框架
- **Express.js** - Web 服务器
- **simple-git** - Git 操作封装
- **Vanilla JS** - 前端框架 (无需构建)

## 开发

```bash
# 安装依赖
npm install

# 开发模式（带 DevTools）
npm run dev

# 生产模式
npm start

# 打包
npm run build
```

## 配置文件

配置文件位于 `~/.my-skills/config.json`：

```json
{
  "skill_paths": [
    "C:\\Users\\sunlc\\.claude\\skills"
  ],
  "git_config": {
    "user_name": "MySkills",
    "user_email": "my-skills@local"
  },
  "skill_sources": {
    "ClaudeCode": ["C:\\Users\\sunlc\\.claude\\skills"],
    "Cursor": [],
    "CodeBuddy": []
  },
  "excluded_skills": [],
  "skill_remotes": {}
}
```

## 路线图

- [ ] 支持技能市场
- [ ] 技能模板创建
- [ ] 技能依赖管理
- [ ] 自动更新检测
- [ ] 插件系统

## 许可证

[MIT](LICENSE)

## 作者

[sunlc](https://github.com/lingcSun)

## 致谢

- [Claude Code](https://claude.ai/code) - Anthropic 的 AI 编程助手
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架
