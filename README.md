# ChatGPT Atmosphere

ChatGPT Atmosphere 是一个 Chrome/Edge Manifest V3 扩展，用本地动态壁纸替换 `https://chatgpt.com/*` 的聊天背景，并支持按本地时间在早晨、中午、晚上、深夜自动切换。

## 演示

<video src="assets/demo/chatgpt-atmosphere-demo.mp4" controls muted playsinline width="900"></video>

如果 GitHub 没有直接渲染视频，可以打开仓库内的演示文件：

[assets/demo/chatgpt-atmosphere-demo.mp4](assets/demo/chatgpt-atmosphere-demo.mp4)

## 功能

- 只支持 Chrome / Edge。
- 只在 `https://chatgpt.com/*` 生效。
- 不读取聊天正文，只使用 URL、浏览器本地时间和扩展本地配置。
- 支持内置动态渐变预设。
- 已内置 `Whale Cloud` 视频壁纸，来自 `/Users/zheqihu/Downloads/whale_cloud.mpkg` 中提取的 `wallpaper.mp4`。
- 支持本地上传图片：`jpg`、`png`、`webp`、`gif`。
- 支持本地上传视频：`mp4`、`webm`，自动静音循环播放。
- 支持早晨 / 中午 / 晚上 / 深夜四段本地时间自动切换。
- 支持 popup 快捷控制和 options 高级设置。
- 支持沉浸式半透明 ChatGPT UI。
- 支持页面不可见时暂停视频壁纸。
- 支持导入 / 导出配置。

## 安装使用

1. 打开 Chrome 或 Edge。
2. 进入扩展管理页面：
   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`
3. 开启“开发者模式”。
4. 点击“加载已解压的扩展程序”。
5. 选择这个目录：

   ```text
   /Users/zheqihu/gpt webui background
   ```

6. 打开或刷新 `https://chatgpt.com/`。

## 设置

点击浏览器工具栏里的 Atmosphere 图标可以打开 popup：

- 开关壁纸。
- 在“按时间”和“手动”之间切换。
- 快速选择当前壁纸。
- 调整遮罩强度和聊天透明度。
- 暂停动态壁纸。

点击“高级设置”可以进入 options 页面：

- 上传图片或视频壁纸。
- 删除本地壁纸。
- 设置早晨 / 中午 / 晚上 / 深夜对应壁纸。
- 调整背景透明度、模糊、亮度、遮罩、侧边栏和输入框透明度。
- 导入或导出配置。

## 本地存储说明

配置存储在 `chrome.storage.local`。上传的图片和视频存储在浏览器 IndexedDB。

IndexedDB 可以理解为浏览器给扩展提供的本地数据库。数据保存在你的本机浏览器里，不会被这个扩展上传到服务器。卸载扩展、清理浏览器站点数据或重置浏览器配置时，这些本地媒体可能丢失。

## 隐私边界

当前版本只申请：

- `storage`
- `https://chatgpt.com/*`

扩展不会采集、上传或分析聊天内容。按时间切换只使用本机当前时间。

## 验证和打包

这个项目不依赖 npm 包。当前机器没有 `npm`，所以实现为零依赖原生 MV3 扩展。

验证：

```bash
node scripts/validate.mjs
```

打包：

```bash
node scripts/package.mjs
```

打包结果：

```text
dist/chatgpt-atmosphere-extension.zip
```

## 已知风险

- ChatGPT 前端结构变化后，沉浸式透明化样式可能需要更新。
- 大视频文件会增加浏览器内存和 GPU 压力，当前上传限制为 80MB。
- 浏览器本地存储不是永久云存储，卸载扩展后媒体通常会丢失。
- 视频壁纸默认静音，不支持声音。

## 当前内置壁纸

`Whale Cloud` 已注册为默认固定壁纸。重新加载扩展并刷新 `https://chatgpt.com/` 后会直接生效。以下今天解析出的 `.mpkg` 也已加入内置壁纸库，可在 popup 或高级设置里自主选择：

- `绣丛阡陌4K`
- `星空之城 4K`
- `彩霞满天 4K`
- `余霞成绮4K`
- `FGO Ring Of Light`
- `星海`
- `雄关漫道真如铁`

提取出的资源位于：

```text
assets/wallpapers/whale-cloud.mp4
assets/wallpapers/whale-cloud-preview.gif
assets/wallpapers/xiu-cong-qian-mo.mp4
assets/wallpapers/xiu-cong-qian-mo-preview.gif
assets/wallpapers/xing-kong-zhi-cheng.mp4
assets/wallpapers/xing-kong-zhi-cheng-preview.jpg
assets/wallpapers/cai-xia-man-tian.mp4
assets/wallpapers/cai-xia-man-tian-preview.jpg
assets/wallpapers/yu-xia-cheng-qi.mp4
assets/wallpapers/yu-xia-cheng-qi-preview.gif
assets/wallpapers/ring-of-light.mp4
assets/wallpapers/ring-of-light-preview.jpg
assets/wallpapers/xing-hai.mp4
assets/wallpapers/xing-hai-preview.jpg
assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie.mp4
assets/wallpapers/xiong-guan-man-dao-zhen-ru-tie-preview.jpg
```
