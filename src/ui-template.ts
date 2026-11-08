export function getDashboardHtml(): string {
  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme="dark" data-font="normal">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <title>QQ 智能消息筛选与 AI 深度日报助手</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    /* ========= 🍎 Apple HIG + Designeer.xyz Curated Studio Design System ========= */
    :root[data-theme="dark"] {
      --bg-canvas: #0b0c0f;
      --bg-sidebar: rgba(20, 21, 26, 0.78);
      --bg-surface: #14151a;
      --bg-elevated: #1c1e26;
      --bg-hover: rgba(255, 255, 255, 0.055);
      --bg-glass: rgba(18, 19, 24, 0.76);
      --bg-modal: rgba(24, 26, 33, 0.92);
      --border-hairline: rgba(255, 255, 255, 0.075);
      --border-strong: rgba(255, 255, 255, 0.16);
      --specular-top: inset 0 1px 0 rgba(255, 255, 255, 0.08);
      --text-primary: #f5f5f7;
      --text-secondary: #a1a1aa;
      --text-muted: #636369;
      --accent: #0a84ff;
      --accent-hover: #409cff;
      --accent-fg: #ffffff;
      --accent-soft: rgba(10, 132, 255, 0.14);
      --accent-border: rgba(10, 132, 255, 0.35);
      --urgent: #ff453a;
      --urgent-soft: rgba(255, 69, 58, 0.12);
      --urgent-border: rgba(255, 69, 58, 0.28);
      --competition: #ff9f0a;
      --competition-soft: rgba(255, 159, 10, 0.12);
      --competition-border: rgba(255, 159, 10, 0.28);
      --ai-tech: #64d2ff;
      --ai-tech-soft: rgba(100, 210, 255, 0.12);
      --ai-tech-border: rgba(100, 210, 255, 0.28);
      --ok: #30d158;
      --ok-soft: rgba(48, 209, 88, 0.13);
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.35);
      --shadow-card: 0 12px 32px -12px rgba(0, 0, 0, 0.65);
      --shadow-float: 0 20px 50px rgba(0, 0, 0, 0.75);
    }

    :root[data-theme="light"] {
      --bg-canvas: #f5f5f7;
      --bg-sidebar: rgba(242, 242, 247, 0.85);
      --bg-surface: #ffffff;
      --bg-elevated: #f0f0f5;
      --bg-hover: rgba(0, 0, 0, 0.045);
      --bg-glass: rgba(255, 255, 255, 0.82);
      --bg-modal: rgba(255, 255, 255, 0.95);
      --border-hairline: rgba(0, 0, 0, 0.075);
      --border-strong: rgba(0, 0, 0, 0.16);
      --specular-top: inset 0 1px 0 rgba(255, 255, 255, 0.8);
      --text-primary: #1d1d1f;
      --text-secondary: #515154;
      --text-muted: #86868b;
      --accent: #0071e3;
      --accent-hover: #0077ed;
      --accent-fg: #ffffff;
      --accent-soft: rgba(0, 113, 227, 0.1);
      --accent-border: rgba(0, 113, 227, 0.28);
      --urgent: #d70015;
      --urgent-soft: rgba(215, 0, 21, 0.07);
      --urgent-border: rgba(215, 0, 21, 0.22);
      --competition: #c93400;
      --competition-soft: rgba(201, 52, 0, 0.08);
      --competition-border: rgba(201, 52, 0, 0.22);
      --ai-tech: #0066cc;
      --ai-tech-soft: rgba(0, 102, 204, 0.08);
      --ai-tech-border: rgba(0, 102, 204, 0.22);
      --ok: #1d8348;
      --ok-soft: rgba(29, 131, 72, 0.1);
      --shadow-sm: 0 2px 8px rgba(0, 0, 0, 0.04);
      --shadow-card: 0 8px 24px -8px rgba(0, 0, 0, 0.07);
      --shadow-float: 0 20px 48px rgba(0, 0, 0, 0.15);
    }

    :root[data-font="normal"] {
      --report-font-size: 14.5px;
      --report-line-height: 1.8;
      --card-font-size: 13.5px;
    }
    :root[data-font="large"] {
      --report-font-size: 16px;
      --report-line-height: 1.88;
      --card-font-size: 14.5px;
    }
    :root[data-font="xlarge"] {
      --report-font-size: 17.5px;
      --report-line-height: 1.92;
      --card-font-size: 15.5px;
    }

    * { box-sizing: border-box; margin: 0; padding: 0; }

    /* 自定义优雅细滚动条 */
    ::-webkit-scrollbar { width: 7px; height: 7px; }
    ::-webkit-scrollbar-track { background: transparent; }
    ::-webkit-scrollbar-thumb {
      background: rgba(140, 140, 150, 0.25);
      border-radius: 999px;
    }
    ::-webkit-scrollbar-thumb:hover { background: rgba(140, 140, 150, 0.45); }

    body {
      font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", "PingFang SC", "HarmonyOS Sans SC", "Microsoft YaHei UI", sans-serif;
      background-color: var(--bg-canvas);
      color: var(--text-primary);
      height: 100vh;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      -webkit-font-smoothing: antialiased;
      user-select: text;
    }

    .mono {
      font-family: 'JetBrains Mono', ui-monospace, SFMono-Regular, Menlo, monospace;
      font-feature-settings: "tnum" on, "zero" on;
    }

    /* ========= 顶部一体化 Apple 质感毛玻璃工具栏 ========= */
    .app-topbar {
      min-height: 52px;
      height: auto;
      flex-shrink: 0;
      background: var(--bg-glass);
      backdrop-filter: saturate(180%) blur(24px);
      -webkit-backdrop-filter: saturate(180%) blur(24px);
      border-bottom: 1px solid var(--border-hairline);
      padding: 8px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 8px 12px;
      z-index: 50;
    }

    .topbar-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .icon-btn {
      background: transparent;
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
      height: 32px;
      padding: 0 10px;
      border-radius: 8px;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 12px;
      font-weight: 500;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.16s ease;
    }
    .icon-btn:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
      border-color: var(--border-strong);
    }

    .brand-badge {
      display: flex;
      align-items: center;
      gap: 7px;
      font-weight: 700;
      font-size: 14px;
      letter-spacing: -0.02em;
      padding-right: 4px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    @media (max-width: 1280px) {
      .brand-badge-text { display: none; }
      .seg-btn .kbd { display: none; }
      #statusChipConn, #statusChipLlm { display: none; }
    }
    .brand-icon {
      width: 24px;
      height: 24px;
      border-radius: 6px;
      background: linear-gradient(135deg, var(--accent), #5e5ce6);
      color: #fff;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 13px;
      flex-shrink: 0;
      box-shadow: 0 2px 8px rgba(10, 132, 255, 0.35);
    }

    /* Apple 分段控制器导航 (Segmented Control) */
    .seg-nav {
      display: inline-flex;
      background: var(--bg-elevated);
      border: 1px solid var(--border-hairline);
      border-radius: 9px;
      padding: 3px;
      gap: 2px;
      flex-shrink: 0;
      flex-wrap: nowrap;
    }
    .seg-btn {
      background: transparent;
      color: var(--text-secondary);
      border: none;
      padding: 5px 11px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 12.5px;
      font-weight: 500;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      flex-shrink: 0;
      transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .seg-btn:hover { color: var(--text-primary); }
    .seg-btn.active {
      background: var(--bg-surface);
      color: var(--text-primary);
      font-weight: 600;
      box-shadow: var(--shadow-sm), var(--specular-top);
    }
    .seg-btn .kbd {
      font-size: 10px;
      opacity: 0.5;
      padding: 0 4px;
      border-radius: 3px;
      border: 1px solid currentColor;
    }

    .topbar-right {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
      flex-shrink: 0;
    }

    .status-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      height: 30px;
      padding: 0 10px;
      border-radius: 999px;
      border: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      color: var(--text-secondary);
      white-space: nowrap;
      flex-shrink: 0;
    }
    .dot { width: 6px; height: 6px; border-radius: 50%; background: var(--text-muted); flex-shrink: 0; }
    .dot.live { background: var(--ok); box-shadow: 0 0 8px var(--ok); }
    .dot.warn { background: var(--competition); }

    .btn {
      background: var(--bg-surface);
      color: var(--text-primary);
      border: 1px solid var(--border-hairline);
      height: 32px;
      padding: 0 11px;
      border-radius: 8px;
      cursor: pointer;
      font-weight: 500;
      font-size: 12.5px;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      transition: all 0.16s cubic-bezier(0.16, 1, 0.3, 1);
      white-space: nowrap;
      flex-shrink: 0;
      box-shadow: var(--specular-top);
    }
    .btn:hover {
      background: var(--bg-elevated);
      border-color: var(--border-strong);
      transform: translateY(-0.5px);
    }
    .btn:active { transform: translateY(0); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

    .btn-primary {
      background: linear-gradient(180deg, var(--accent-hover) 0%, var(--accent) 100%);
      color: var(--accent-fg);
      border: 1px solid rgba(255, 255, 255, 0.18);
      font-weight: 600;
      box-shadow: 0 2px 10px rgba(10, 132, 255, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.25);
    }
    .btn-primary:hover {
      background: var(--accent-hover);
      border-color: rgba(255, 255, 255, 0.3);
      box-shadow: 0 4px 14px rgba(10, 132, 255, 0.42);
    }

    /* ========= 主工作台全屏双栏容器 (无嵌套双滚动条) ========= */
    .workspace-body {
      flex: 1;
      display: flex;
      overflow: hidden;
      position: relative;
    }

    .tab-pane {
      flex: 1;
      display: flex;
      height: 100%;
      overflow: hidden;
    }

    /* ========= 左侧 Apple Notes / Craft 风格目录与期数侧边栏 ========= */
    .digest-sidebar {
      width: 276px;
      flex-shrink: 0;
      background: var(--bg-sidebar);
      backdrop-filter: saturate(180%) blur(20px);
      border-right: 1px solid var(--border-hairline);
      display: flex;
      flex-direction: column;
      height: 100%;
      overflow: hidden;
      transition: width 0.22s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.18s ease;
    }
    .digest-sidebar.collapsed {
      width: 0;
      border-right: none;
      opacity: 0;
      pointer-events: none;
    }

    .sidebar-section {
      padding: 14px 14px 10px;
      border-bottom: 1px solid var(--border-hairline);
    }
    .sidebar-heading {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: var(--text-muted);
      margin-bottom: 8px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    /* 紧凑型状态胶囊组 */
    .mini-metrics {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 7px;
    }
    .mini-metric-box {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 9px;
      padding: 8px 10px;
      box-shadow: var(--specular-top);
    }
    .mini-metric-label {
      font-size: 10.5px;
      color: var(--text-muted);
      display: block;
    }
    .mini-metric-val {
      font-size: 15px;
      font-weight: 700;
      color: var(--text-primary);
      margin-top: 2px;
    }

    /* 目录大纲列表 */
    .toc-scroll {
      flex: 1;
      overflow-y: auto;
      padding: 12px 10px;
      display: flex;
      flex-direction: column;
      gap: 14px;
    }
    .toc-list {
      display: flex;
      flex-direction: column;
      gap: 3px;
    }
    .toc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding: 7px 10px;
      border-radius: 8px;
      font-size: 12.5px;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all 0.14s ease;
      text-align: left;
      border: 1px solid transparent;
      background: transparent;
      width: 100%;
    }
    .toc-item:hover {
      background: var(--bg-hover);
      color: var(--text-primary);
    }
    .toc-item.active {
      background: var(--accent-soft);
      color: var(--accent);
      border-color: var(--accent-border);
      font-weight: 600;
    }
    .toc-badge {
      font-size: 10.5px;
      padding: 1px 6px;
      border-radius: 999px;
      background: var(--bg-elevated);
      color: var(--text-secondary);
    }

    /* 历史期数列表 */
    .period-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 8px 10px;
      border-radius: 8px;
      cursor: pointer;
      border: 1px solid transparent;
      background: transparent;
      text-align: left;
      width: 100%;
      transition: all 0.14s ease;
    }
    .period-item:hover { background: var(--bg-hover); }
    .period-item.active {
      background: var(--bg-surface);
      border-color: var(--border-strong);
      box-shadow: var(--shadow-sm);
    }
    .period-title {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--text-primary);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .period-sub {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* ========= 右侧沉浸式主阅读画布 (单一顺滑滚动条) ========= */
    .digest-main-canvas {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      scroll-behavior: smooth;
      display: flex;
      flex-direction: column;
    }

    /* 吸顶阅读控制条 */
    .reading-sticky-bar {
      position: sticky;
      top: 0;
      z-index: 30;
      background: var(--bg-glass);
      backdrop-filter: saturate(180%) blur(20px);
      -webkit-backdrop-filter: saturate(180%) blur(20px);
      border-bottom: 1px solid var(--border-hairline);
      padding: 10px 28px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      flex-wrap: wrap;
    }

    .chip-group { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .chip {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
      padding: 5px 11px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.15s ease;
      display: inline-flex;
      align-items: center;
      gap: 5px;
      white-space: nowrap;
      flex-shrink: 0;
    }
    .chip:hover { border-color: var(--border-strong); color: var(--text-primary); }
    .chip.active {
      background: var(--text-primary);
      color: var(--bg-canvas);
      border-color: var(--text-primary);
      font-weight: 600;
    }

    .search-input {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      color: var(--text-primary);
      height: 32px;
      padding: 0 12px;
      border-radius: 8px;
      font-size: 12.5px;
      width: 230px;
      outline: none;
      transition: border-color 0.15s;
    }
    .search-input:focus { border-color: var(--accent); }

    .reading-content-wrap {
      max-width: 1120px;
      width: 100%;
      margin: 0 auto;
      padding: 24px 32px 80px;
    }

    /* ========= 📖 Apple + Designeer 所见即所得 (WYSIWYG) 深度研报排版 ========= */
    .wysiwyg-article {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 16px;
      padding: 32px 38px;
      box-shadow: var(--shadow-card), var(--specular-top);
      font-size: var(--report-font-size);
      line-height: var(--report-line-height);
      color: var(--text-primary);
      margin-bottom: 28px;
    }

    .report-header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 16px;
      flex-wrap: wrap;
      padding-bottom: 20px;
      margin-bottom: 20px;
      border-bottom: 1px solid var(--border-hairline);
    }

    .report-kicker {
      font-size: 11.5px;
      font-weight: 600;
      color: var(--accent);
      letter-spacing: 0.04em;
      text-transform: uppercase;
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 6px;
    }

    .wy-h1 {
      font-size: 24px;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.025em;
      line-height: 1.25;
      margin-bottom: 12px;
    }

    .wy-h2 {
      font-size: 17.5px;
      font-weight: 700;
      color: var(--text-primary);
      margin: 32px 0 14px 0;
      padding: 10px 16px;
      background: var(--bg-elevated);
      border-left: 3.5px solid var(--accent);
      border-radius: 0 10px 10px 0;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      scroll-margin-top: 72px;
    }

    .wy-h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--competition);
      margin: 20px 0 10px 0;
      padding-left: 4px;
    }

    .wy-quote {
      background: var(--bg-elevated);
      border: 1px solid var(--border-hairline);
      border-left: 3px solid var(--accent);
      padding: 10px 15px;
      border-radius: 8px;
      margin-bottom: 8px;
      font-size: 13px;
      color: var(--text-secondary);
      line-height: 1.65;
    }

    .wy-p {
      margin: 12px 0;
      color: var(--text-primary);
      font-size: var(--report-font-size);
      line-height: var(--report-line-height);
    }

    /* 待办清单进度条与控制器 */
    .todo-progress-bar-wrap {
      background: var(--bg-elevated);
      border: 1px solid var(--border-hairline);
      border-radius: 10px;
      padding: 12px 16px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      flex-wrap: wrap;
    }
    .todo-progress-track {
      flex: 1;
      min-width: 160px;
      height: 7px;
      background: rgba(140, 140, 150, 0.2);
      border-radius: 999px;
      overflow: hidden;
    }
    .todo-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), var(--ok));
      border-radius: 999px;
      transition: width 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }

    .wy-todo {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 11px 15px;
      margin-bottom: 8px;
      background: var(--bg-canvas);
      border: 1px solid var(--border-hairline);
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .wy-todo:hover {
      border-color: var(--border-strong);
      background: var(--bg-elevated);
    }
    .wy-todo input[type="checkbox"] {
      margin-top: 5px;
      width: 16px;
      height: 16px;
      accent-color: var(--ok);
      cursor: pointer;
      flex-shrink: 0;
    }
    .wy-todo.done {
      opacity: 0.48;
      background: transparent;
    }
    .wy-todo.done .wy-todo-body {
      text-decoration: line-through;
      color: var(--text-muted);
    }
    .wy-todo.hidden-done {
      display: none !important;
    }
    .wy-todo-num {
      font-family: 'JetBrains Mono', monospace;
      font-size: 12.5px;
      font-weight: 600;
      color: var(--accent);
      min-width: 24px;
      padding-top: 1px;
    }
    .wy-todo-body {
      flex: 1;
      font-size: var(--report-font-size);
      line-height: 1.68;
    }

    /* 简报内嵌议题块（自带内联一键溯源按钮） */
    .wy-item-block {
      background: var(--bg-canvas);
      border: 1px solid var(--border-hairline);
      border-radius: 12px;
      padding: 16px 18px;
      margin-bottom: 12px;
      transition: border-color 0.16s ease, box-shadow 0.16s ease;
    }
    .wy-item-block:hover {
      border-color: var(--border-strong);
      box-shadow: var(--shadow-sm);
    }
    .wy-item-head {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }
    .wy-group-tag {
      font-size: 11.5px;
      font-weight: 600;
      padding: 2px 9px;
      border-radius: 6px;
      background: var(--accent-soft);
      border: 1px solid var(--accent-border);
      color: var(--accent);
    }
    .wy-item-title {
      font-size: 15.5px;
      font-weight: 600;
      color: var(--text-primary);
    }
    .wy-item-right {
      margin-left: auto;
      display: inline-flex;
      align-items: center;
      gap: 8px;
    }
    .wy-item-time {
      font-size: 11.5px;
      color: var(--text-muted);
    }
    .wy-trace-btn {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      color: var(--text-secondary);
      padding: 3px 9px;
      border-radius: 6px;
      font-size: 11.5px;
      font-weight: 500;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      transition: all 0.15s ease;
    }
    .wy-trace-btn:hover {
      background: var(--accent);
      color: #fff;
      border-color: var(--accent);
    }

    .wy-sub-item {
      font-size: var(--report-font-size);
      color: var(--text-secondary);
      line-height: var(--report-line-height);
      padding-left: 4px;
      margin-top: 6px;
    }
    .wy-sub-action {
      font-size: 13.5px;
      color: var(--urgent);
      background: var(--urgent-soft);
      border: 1px solid var(--urgent-border);
      border-radius: 8px;
      padding: 8px 12px;
      margin-top: 9px;
    }
    .wy-note-item {
      background: var(--bg-canvas);
      border: 1px solid var(--border-hairline);
      border-left: 3px solid var(--ai-tech);
      padding: 12px 16px;
      border-radius: 0 10px 10px 0;
      margin-bottom: 10px;
      font-size: var(--report-font-size);
      line-height: var(--report-line-height);
      color: var(--text-secondary);
    }
    .wy-code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88em;
      padding: 2px 6px;
      border-radius: 5px;
      background: var(--bg-elevated);
      border: 1px solid var(--border-hairline);
      color: var(--ai-tech);
    }
    .wy-strong {
      font-weight: 600;
      color: var(--text-primary);
    }
    .wy-link {
      color: var(--accent);
      text-decoration: underline;
      text-underline-offset: 3px;
      word-break: break-all;
    }

    /* ========= 🗂️ Designeer.xyz 策展级灵感卡片网格 ========= */
    .digest-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
      gap: 16px;
    }
    @media (max-width: 640px) { .digest-grid { grid-template-columns: 1fr; } }

    .intel-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 14px;
      padding: 20px;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      gap: 14px;
      box-shadow: var(--specular-top);
      transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .intel-card:hover {
      border-color: var(--border-strong);
      transform: translateY(-2px);
      box-shadow: var(--shadow-card), var(--specular-top);
    }
    .intel-card.urgent { border-top: 2.5px solid var(--urgent); }
    .intel-card.competition { border-top: 2.5px solid var(--competition); }
    .intel-card.ai_knowledge { border-top: 2.5px solid var(--ai-tech); }

    .intel-meta { display: flex; justify-content: space-between; align-items: center; gap: 8px; }
    .group-badge {
      font-size: 11.5px;
      font-weight: 600;
      padding: 3px 9px;
      border-radius: 6px;
      background: var(--bg-elevated);
      color: var(--text-primary);
      border: 1px solid var(--border-hairline);
      max-width: 210px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .level-tag { font-size: 11px; padding: 2px 8px; border-radius: 5px; font-weight: 600; }
    .level-urgent { background: var(--urgent-soft); color: var(--urgent); border: 1px solid var(--urgent-border); }
    .level-comp { background: var(--competition-soft); color: var(--competition); border: 1px solid var(--competition-border); }
    .level-ai { background: var(--ai-tech-soft); color: var(--ai-tech); border: 1px solid var(--ai-tech-border); }
    .level-disc { background: var(--bg-elevated); color: var(--text-secondary); border: 1px solid var(--border-hairline); }

    .intel-title { font-size: 15.5px; font-weight: 600; color: var(--text-primary); line-height: 1.38; }
    .intel-summary { font-size: var(--card-font-size); color: var(--text-secondary); line-height: 1.68; }
    .intel-action {
      padding: 9px 12px;
      border-radius: 8px;
      background: var(--urgent-soft);
      border: 1px solid var(--urgent-border);
      color: var(--urgent);
      font-size: 12.5px;
      font-weight: 500;
    }
    .intel-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 12px;
      border-top: 1px solid var(--border-hairline);
      font-size: 11.5px;
      color: var(--text-muted);
    }

    /* ========= 其他页签全高滚动容器 ========= */
    .full-scroll-pane {
      flex: 1;
      height: 100%;
      overflow-y: auto;
      padding: 24px 32px 80px;
    }
    .pane-inner {
      max-width: 1200px;
      margin: 0 auto;
    }

    /* 实时群聊漏斗表格 */
    .stream-table {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 14px;
      overflow: hidden;
      box-shadow: var(--shadow-sm);
    }
    .stream-row {
      display: grid;
      grid-template-columns: 95px 185px 135px 1fr 150px;
      gap: 12px;
      align-items: center;
      padding: 11px 16px;
      border-bottom: 1px solid var(--border-hairline);
      font-size: 13px;
      transition: background 0.12s;
    }
    .stream-row:hover { background: var(--bg-hover); }
    .stream-row.noise { opacity: 0.42; }
    @media (max-width: 820px) { .stream-row { grid-template-columns: 1fr; gap: 4px; } }

    .panel-card {
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      border-radius: 14px;
      padding: 22px;
      margin-bottom: 20px;
      box-shadow: var(--specular-top);
    }
    .field-label { display: block; font-size: 12px; font-weight: 600; color: var(--text-secondary); margin-bottom: 6px; }
    .field-input, .field-select {
      width: 100%;
      padding: 9px 12px;
      background: var(--bg-canvas);
      border: 1px solid var(--border-hairline);
      color: var(--text-primary);
      border-radius: 8px;
      font-size: 13px;
      margin-bottom: 14px;
      outline: none;
    }
    .field-input:focus, .field-select:focus { border-color: var(--accent); }

    /* ========= 🔍 右侧 Apple 毛玻璃溯源与快捷回复抽屉 ========= */
    .drawer-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      z-index: 100;
      display: none;
      justify-content: flex-end;
    }
    .drawer {
      width: 100%;
      max-width: 580px;
      background: var(--bg-modal);
      backdrop-filter: saturate(180%) blur(28px);
      height: 100%;
      display: flex;
      flex-direction: column;
      border-left: 1px solid var(--border-strong);
      box-shadow: var(--shadow-float);
    }
    .drawer-head {
      padding: 16px 20px;
      border-bottom: 1px solid var(--border-hairline);
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .drawer-body {
      padding: 18px 20px;
      overflow-y: auto;
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .chat-bubble {
      padding: 12px 15px;
      border-radius: 12px;
      background: var(--bg-surface);
      border: 1px solid var(--border-hairline);
      font-size: 13.5px;
      transition: border-color 0.15s;
    }
    .chat-bubble.anchor {
      background: var(--accent-soft);
      border-color: var(--accent);
      box-shadow: 0 0 0 1px var(--accent-border);
    }

    .chat-composer {
      padding: 12px 18px;
      border-top: 1px solid var(--border-hairline);
      background: var(--bg-surface);
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .reply-banner {
      display: none;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      padding: 5px 10px;
      border-radius: 6px;
      background: var(--bg-elevated);
      color: var(--text-secondary);
      border-left: 2.5px solid var(--accent);
    }
    .composer-row { display: flex; gap: 8px; align-items: center; }
    .composer-input {
      flex: 1;
      background: var(--bg-canvas);
      border: 1px solid var(--border-hairline);
      color: var(--text-primary);
      padding: 9px 13px;
      border-radius: 8px;
      font-size: 13px;
      outline: none;
    }
    .composer-input:focus { border-color: var(--accent); }

    /* ========= 🔔 原生桌面级 Toast 通知与模态框 (彻底消灭 127.0.0.1:3210 弹窗) ========= */
    .toast-stack {
      position: fixed;
      top: 66px;
      right: 20px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast-card {
      pointer-events: auto;
      min-width: 280px;
      max-width: 420px;
      background: var(--bg-modal);
      backdrop-filter: saturate(180%) blur(24px);
      border: 1px solid var(--border-strong);
      border-radius: 12px;
      padding: 12px 16px;
      box-shadow: var(--shadow-float);
      display: flex;
      align-items: flex-start;
      gap: 10px;
      animation: toastIn 0.22s cubic-bezier(0.16, 1, 0.3, 1);
    }
    @keyframes toastIn {
      from { opacity: 0; transform: translateY(-8px) scale(0.97); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }
    .toast-title { font-size: 13px; font-weight: 600; color: var(--text-primary); }
    .toast-msg { font-size: 12px; color: var(--text-secondary); margin-top: 2px; line-height: 1.45; }

    /* AI 生成实时进度浮层 */
    .ai-progress-banner {
      display: none;
      margin-bottom: 18px;
      background: var(--bg-surface);
      border: 1px solid var(--accent-border);
      border-radius: 14px;
      padding: 16px 20px;
      box-shadow: var(--shadow-card);
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }
    .ai-spinner {
      width: 18px;
      height: 18px;
      border: 2.5px solid var(--accent-soft);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* 原生感确认模态框 */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.55);
      backdrop-filter: blur(6px);
      z-index: 180;
      display: none;
      align-items: center;
      justify-content: center;
    }
    .modal-box {
      width: 100%;
      max-width: 400px;
      background: var(--bg-modal);
      backdrop-filter: saturate(180%) blur(28px);
      border: 1px solid var(--border-strong);
      border-radius: 16px;
      padding: 22px;
      box-shadow: var(--shadow-float);
      text-align: center;
    }
  </style>
</head>
<body>
  <!-- 顶部一体化 Apple 毛玻璃工具栏 -->
  <header class="app-topbar">
    <div class="topbar-left">
      <button class="icon-btn" onclick="toggleSidebar()" id="sidebarToggleBtn" title="展开/收起左侧目录大纲 (快捷键 [)">
        <span>◧</span>
        <span>目录</span>
      </button>
      <div class="brand-badge">
        <span class="brand-icon">✦</span>
        <span class="brand-badge-text">Digest Studio</span>
      </div>

      <!-- Apple 分段导航 -->
      <nav class="seg-nav">
        <button class="seg-btn active" onclick="switchTab('digest', this)" id="tabBtn-digest">
          <span>📅 智能日报</span>
          <span class="kbd mono">1</span>
        </button>
        <button class="seg-btn" onclick="switchTab('stream', this)" id="tabBtn-stream">
          <span>🌊 实时降噪流</span>
          <span class="kbd mono">2</span>
        </button>
        <button class="seg-btn" onclick="switchTab('groups', this)" id="tabBtn-groups">
          <span>🗂️ 群聊订阅</span>
          <span class="kbd mono">3</span>
        </button>
        <button class="seg-btn" onclick="switchTab('settings', this)" id="tabBtn-settings">
          <span>⚙️ 引擎与设置</span>
          <span class="kbd mono">4</span>
        </button>
      </nav>
    </div>

    <div class="topbar-right">
      <span class="status-chip" id="statusChipConn" title="官方桌面 QQ 有头共存连接状态">
        <span id="connDot" class="dot warn"></span>
        <span id="connText" class="mono" style="font-size:11px;">QQ: CONNECTING</span>
      </span>
      <span class="status-chip" id="statusChipLlm" title="远程 AI 模型网关状态">
        <span id="llmDot" class="dot warn"></span>
        <span id="llmText" class="mono" style="font-size:11px;">AI: CHECKING</span>
      </span>

      <button class="icon-btn mono" onclick="cycleFontSize()" id="fontBtn" title="切换日报阅读字号大小">Aa 标准</button>
      <button class="icon-btn" onclick="toggleTheme()" id="themeBtn" title="切换 Apple 深空黑 / 暖白纸张主题">◐</button>
      <button class="btn" onclick="syncMissedMessages()" id="syncBtn" title="主动向 QQ 客户端拉取各群最新离线/漫游消息">🔄 同步消息</button>
      <button class="btn" onclick="launchCoexistQQ()" id="launchNapCatBtn" title="呼出或启动有头共存版官方桌面 QQ">💬 官方 QQ</button>
      <button class="btn btn-primary" onclick="generateNow()" id="genBtn">✦ 总结新增消息</button>
    </div>
  </header>

  <!-- 全屏无嵌套滚动工作区 -->
  <div class="workspace-body">
    <!-- TAB 1: 智能日报工作台 (左目录 + 右沉浸阅读/卡片) -->
    <section class="tab-pane" id="tab-digest">
      <!-- 左侧可折叠目录与期数导航栏 -->
      <aside class="digest-sidebar" id="digestSidebar">
        <div class="sidebar-section">
          <div class="sidebar-heading">
            <span>增量水印与脱水概览</span>
            <span class="mono" id="sidebarPeriodBadge">#--</span>
          </div>
          <div style="display:flex; gap:6px; flex-wrap:wrap; margin-bottom:8px;" id="sidebarStatusRow">
            <span class="status-chip" style="height:24px; padding:0 8px; font-size:10.5px;">
              <span id="sbConnDot" class="dot warn"></span>
              <span id="sbConnText" class="mono">QQ 连接中</span>
            </span>
            <span class="status-chip" style="height:24px; padding:0 8px; font-size:10.5px;">
              <span id="sbLlmDot" class="dot warn"></span>
              <span id="sbLlmText" class="mono">AI 检测中</span>
            </span>
          </div>
          <div class="mini-metrics" id="sidebarMetrics">
            <div class="mini-metric-box">
              <span class="mini-metric-label">新增待总结</span>
              <div class="mini-metric-val mono" id="metricUnsum">--</div>
            </div>
            <div class="mini-metric-box">
              <span class="mini-metric-label">本期提炼议题</span>
              <div class="mini-metric-val mono" id="metricTopics">--</div>
            </div>
          </div>
          <div class="mono" style="font-size:10.5px; color:var(--text-muted); margin-top:8px; line-height:1.45;" id="sidebarWatermarkText">
            上次总结锚点: 读取中...
          </div>
        </div>

        <div class="toc-scroll">
          <!-- 本期章节目录大纲 -->
          <div>
            <div class="sidebar-heading" style="padding:0 4px;">
              <span>📖 本期章节快速跳转</span>
            </div>
            <div class="toc-list" id="tocContainer"></div>
          </div>

          <!-- 历史期数切换 -->
          <div>
            <div class="sidebar-heading" style="padding:0 4px;">
              <span>🗂️ 历史日报期数</span>
            </div>
            <div class="toc-list" id="periodListContainer"></div>
          </div>
        </div>
      </aside>

      <!-- 右侧单一顺畅滚动阅读区 -->
      <div class="digest-main-canvas" id="digestMainScroll">
        <!-- 吸顶视图切换与分类筛选栏 -->
        <div class="reading-sticky-bar">
          <div style="display:flex; align-items:center; gap:10px; flex-wrap:wrap;">
            <!-- 视图切换器 -->
            <div class="seg-nav" id="viewModeNav">
              <button class="seg-btn active" onclick="setViewMode('both', this)" id="viewBtn-both">◫ 研报+卡片</button>
              <button class="seg-btn" onclick="setViewMode('report', this)" id="viewBtn-report">📖 沉浸研报</button>
              <button class="seg-btn" onclick="setViewMode('cards', this)" id="viewBtn-cards">🗂️ 灵感卡片</button>
            </div>

            <!-- 分类胶囊筛选 -->
            <div class="chip-group" id="categoryChips">
              <button class="chip active" onclick="setDigestFilter('all', this)">全部</button>
              <button class="chip" onclick="setDigestFilter('urgent', this)">🚨 必看待办</button>
              <button class="chip" onclick="setDigestFilter('competition', this)">🏆 学科竞赛</button>
              <button class="chip" onclick="setDigestFilter('ai_knowledge', this)">🤖 AI 干货</button>
              <button class="chip" onclick="setDigestFilter('discussion', this)">💬 讨论</button>
            </div>
          </div>

          <div style="display:flex; align-items:center; gap:8px;">
            <input class="search-input" id="digestSearch" placeholder="🔍 搜索群名、竞赛、AI 关键词..." oninput="renderDigestTab(true)" />
            <button class="icon-btn" onclick="copyCurrentDigestMarkdown()" title="一键复制本期完整 Markdown 日报">📋 复制全文</button>
            <button class="icon-btn" onclick="reRunCurrentDigest()" title="重新调用 AI 提炼本期消息">🔄 重跑本期</button>
          </div>
        </div>

        <!-- 正文内容容器 -->
        <div class="reading-content-wrap">
          <!-- AI 生成实时进度横幅 -->
          <div class="ai-progress-banner" id="aiProgressBanner">
            <div style="display:flex; align-items:center; gap:12px;">
              <div class="ai-spinner"></div>
              <div>
                <div style="font-size:13.5px; font-weight:600; color:var(--text-primary);" id="aiProgressTitle">正在通盘阅读新增群消息并生成深度日报...</div>
                <div style="font-size:12px; color:var(--text-secondary); margin-top:2px;" id="aiProgressSub">100% 原汁原味零截断分析中，预计耗时 10 ~ 25 秒</div>
              </div>
            </div>
            <span class="mono" style="font-size:12px; color:var(--accent);" id="aiProgressTimer">0.0s</span>
          </div>

          <div id="digestContainer"></div>
        </div>
      </div>
    </section>

    <!-- TAB 2: 🌊 实时群聊降噪漏斗流 -->
    <section class="tab-pane" id="tab-stream" style="display:none;">
      <div class="full-scroll-pane">
        <div class="pane-inner">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
            <div class="chip-group">
              <button class="chip active" onclick="setStreamFilter('all', this)">全部实时群消息</button>
              <button class="chip" onclick="setStreamFilter('unsummarized', this)">🆕 待总结增量消息</button>
              <button class="chip" onclick="setStreamFilter('summarized', this)">🏷️ 已打标总结消息</button>
              <button class="chip" onclick="setStreamFilter('kept', this)">✅ 已保留有效消息</button>
              <button class="chip" onclick="setStreamFilter('high', this)">🔥 高优 (@我 / 关键词)</button>
              <button class="chip" onclick="setStreamFilter('noise', this)">🗑️ L1 规则已拦截噪音</button>
            </div>
            <button class="btn mono" onclick="fetchStatus()">↻ 刷新实时流</button>
          </div>
          <div class="stream-table" id="streamList"></div>
        </div>
      </div>
    </section>

    <!-- TAB 3: 🗂️ 群聊订阅与权重 -->
    <section class="tab-pane" id="tab-groups" style="display:none;">
      <div class="full-scroll-pane">
        <div class="pane-inner">
          <div class="panel-card">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
              <div>
                <h3 style="font-size:17px;">已捕获的活跃 QQ 群聊配置</h3>
                <p style="font-size:12.5px; color:var(--text-secondary); margin-top:4px;">
                  可单独关闭纯闲聊群，或为重点群配置专属 AI 提示词（如：“重点提取课程作业截止时间与老师通知”）。
                </p>
              </div>
              <button class="btn btn-primary" onclick="saveGroupRules()">💾 保存群聊订阅配置</button>
            </div>
            <div id="groupsList" class="digest-grid"></div>
          </div>
        </div>
      </div>
    </section>

    <!-- TAB 4: ⚙️ 远程 AI API 与系统设置 -->
    <section class="tab-pane" id="tab-settings" style="display:none;">
      <div class="full-scroll-pane">
        <div class="pane-inner">
          <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(380px, 1fr)); gap:20px;">
            <div class="panel-card">
              <div class="mono" style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">REMOTE LLM ENGINE</div>
              <h3 style="font-size:17px; margin-bottom:14px;">🤖 远程 AI 大模型 API 配置</h3>
              <div style="margin-bottom:16px; display:flex; gap:6px; flex-wrap:wrap;">
                <button class="chip" onclick="applyPreset('https://api.deepseek.com/v1','deepseek-chat','deepseek-chat')">DeepSeek 官方</button>
                <button class="chip" onclick="applyPreset('https://api.siliconflow.cn/v1','deepseek-ai/DeepSeek-V3','deepseek-ai/DeepSeek-V3')">硅基流动 SiliconFlow</button>
                <button class="chip" onclick="applyPreset('https://dashscope.aliyuncs.com/compatible-mode/v1','qwen-plus','qwen-max')">阿里云百炼 (通义千问)</button>
                <button class="chip" onclick="applyPreset('https://generativelanguage.googleapis.com/v1beta/openai','gemini-2.5-flash','gemini-2.5-pro')">Google Gemini</button>
                <button class="chip" onclick="applyPreset('https://api.openai.com/v1','gpt-4o-mini','gpt-4o')">OpenAI</button>
              </div>

              <label class="field-label">API Base URL</label>
              <input class="field-input mono" id="cfg_llm_baseUrl" placeholder="https://api.deepseek.com/v1" />

              <label class="field-label">API Key (留空或不修改则保持原密钥)</label>
              <input class="field-input mono" id="cfg_llm_apiKey" type="password" placeholder="sk-..." />

              <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
                <div>
                  <label class="field-label">初筛轻量模型</label>
                  <input class="field-input mono" id="cfg_llm_fastModel" placeholder="deepseek-chat" />
                </div>
                <div>
                  <label class="field-label">总结主力模型</label>
                  <input class="field-input mono" id="cfg_llm_mainModel" placeholder="deepseek-chat" />
                </div>
              </div>

              <div style="display:flex; gap:10px; align-items:center; flex-wrap:wrap;">
                <button class="btn" onclick="testLlmApi()" id="testApiBtn">🔌 测试 API 连通性</button>
                <span id="testApiResult" style="font-size:12.5px;"></span>
              </div>
            </div>

            <div class="panel-card">
              <div class="mono" style="font-size:11px; color:var(--text-muted); margin-bottom:4px;">MOBILE PUSH & LAN ACCESS</div>
              <h3 style="font-size:17px; margin-bottom:14px;">📱 手机端强提醒与局域网访问</h3>

              <div style="background:var(--bg-canvas); border:1px solid var(--border-hairline); border-radius:10px; padding:10px 14px; margin-bottom:14px; display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:12.5px; color:var(--text-secondary);">手机局域网同步阅读地址</span>
                <strong class="mono" id="lanUrlText" style="font-size:12.5px; color:var(--accent);">http://127.0.0.1:3210</strong>
              </div>

              <label class="field-label">手机端实时强提醒推送 (当群内有人 @我 或命中高优关键词时触发)</label>
              <select class="field-select" id="cfg_push_enabled">
                <option value="false">关闭实时推送</option>
                <option value="true">开启实时强提醒推送</option>
              </select>

              <div style="display:grid; grid-template-columns:1fr 2fr; gap:12px;">
                <div>
                  <label class="field-label">推送通道</label>
                  <select class="field-select" id="cfg_push_type">
                    <option value="bark">Bark (iOS)</option>
                    <option value="feishu">飞书机器人</option>
                    <option value="pushplus">PushPlus / Webhook</option>
                  </select>
                </div>
                <div>
                  <label class="field-label">Webhook 地址</label>
                  <input class="field-input mono" id="cfg_push_url" placeholder="https://api.day.app/你的Key/" />
                </div>
              </div>

              <label class="field-label">高优先级关键词 (英文逗号分隔)</label>
              <input class="field-input" id="cfg_filter_keywords" placeholder="通知,截止,DDL,作业,考试,报名,紧急" />

              <label class="field-label">NapCat 正向 WebSocket 地址</label>
              <input class="field-input mono" id="cfg_napcat_wsUrl" placeholder="ws://127.0.0.1:3001" />

              <button class="btn btn-primary" style="width:100%; justify-content:center; margin-top:6px;" onclick="saveSettings()">
                💾 保存全部系统配置
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  </div>

  <!-- 原消息溯源与直接回复抽屉 -->
  <div class="drawer-backdrop" id="ctxDrawer" onclick="if(event.target===this)closeDrawer()">
    <div class="drawer">
      <div class="drawer-head">
        <div>
          <div class="mono" style="font-size:10.5px; color:var(--accent);">ORIGINAL CONTEXT TRACE & QUICK REPLY</div>
          <h4 id="drawerTitle" style="font-size:15px; margin-top:2px;">🔍 原聊天记录上下文溯源</h4>
        </div>
        <button class="btn mono" onclick="closeDrawer()">ESC 关闭</button>
      </div>
      <div class="drawer-body" id="drawerBody"></div>
      <div class="chat-composer">
        <div class="reply-banner" id="drawerReplyBanner">
          <span id="drawerReplyText"></span>
          <button class="icon-btn mono" style="height:22px; padding:0 6px; font-size:11px;" onclick="clearDrawerReply()">× 取消</button>
        </div>
        <div class="composer-row">
          <input class="composer-input" id="drawerInput" placeholder="直接在此群发送回复（按 Enter 发送）..."
            onkeydown="if(event.key==='Enter'){event.preventDefault();sendDrawerQuickReply();}" />
          <button class="btn btn-primary mono" onclick="sendDrawerQuickReply()" id="drawerSendBtn">发送 ↵</button>
        </div>
      </div>
    </div>
  </div>

  <!-- 原生感确认模态框 (替代 window.confirm) -->
  <div class="modal-backdrop" id="confirmModalBackdrop" onclick="if(event.target===this)closeConfirmModal()">
    <div class="modal-box">
      <h4 style="font-size:16px; font-weight:600; margin-bottom:8px;" id="confirmModalTitle">确认操作</h4>
      <p style="font-size:13px; color:var(--text-secondary); line-height:1.55; margin-bottom:18px;" id="confirmModalMsg"></p>
      <div style="display:flex; gap:10px; justify-content:center;">
        <button class="btn" style="flex:1; justify-content:center;" onclick="closeConfirmModal()">取消</button>
        <button class="btn btn-primary" style="flex:1; justify-content:center;" id="confirmModalOkBtn">确定</button>
      </div>
    </div>
  </div>

  <!-- 桌面级右上角 Toast 通知栈 (彻底替代 window.alert) -->
  <div class="toast-stack" id="toastStack"></div>

  <script>
    let appState = null;
    let currentDigestFilter = 'all';
    let currentStreamFilter = 'all';
    let currentViewMode = localStorage.getItem('digesteer_view_mode') || 'both'; // 'both' | 'report' | 'cards'
    let selectedDigestId = null;
    let hideCompletedTodos = localStorage.getItem('digesteer_hide_done_todos') === '1';
    let lastDigestRenderSignature = '';
    let lastStreamRenderSignature = '';
    let lastGroupsRenderSignature = '';
    let aiTimerInterval = null;

    /* ========= 🔔 桌面级 Toast 与模态确认框 (零 127.0.0.1 弹窗) ========= */
    function showToast(title, message = '', type = 'info', durationMs = 3800) {
      const stack = document.getElementById('toastStack');
      if (!stack) return;
      const icons = {
        success: '✅',
        info: '✦',
        warn: '⚠️',
        error: '🚨'
      };
      const borderColors = {
        success: 'var(--ok)',
        info: 'var(--accent)',
        warn: 'var(--competition)',
        error: 'var(--urgent)'
      };
      const card = document.createElement('div');
      card.className = 'toast-card';
      card.style.borderLeft = '3.5px solid ' + (borderColors[type] || 'var(--accent)');
      card.innerHTML = \`
        <span style="font-size:15px; line-height:1.2;">\${icons[type] || '✦'}</span>
        <div style="flex:1; min-width:0;">
          <div class="toast-title">\${escapeHtmlStr(title)}</div>
          \${message ? \`<div class="toast-msg">\${escapeHtmlStr(message)}</div>\` : ''}
        </div>
      \`;
      stack.appendChild(card);
      setTimeout(() => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(-6px)';
        card.style.transition = 'all 0.2s ease';
        setTimeout(() => card.remove(), 220);
      }, durationMs);
    }

    let pendingConfirmAction = null;
    function showConfirmModal(title, message, onConfirm) {
      pendingConfirmAction = onConfirm;
      document.getElementById('confirmModalTitle').textContent = title;
      document.getElementById('confirmModalMsg').textContent = message;
      document.getElementById('confirmModalBackdrop').style.display = 'flex';
      document.getElementById('confirmModalOkBtn').onclick = () => {
        const fn = pendingConfirmAction;
        closeConfirmModal();
        if (fn) fn();
      };
    }
    function closeConfirmModal() {
      pendingConfirmAction = null;
      document.getElementById('confirmModalBackdrop').style.display = 'none';
    }

    function escapeHtmlStr(str) {
      return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }

    function formatInlineMarkdown(raw) {
      let s = escapeHtmlStr(raw);
      s = s.replace(/\\x60([^\\x60]+)\\x60/g, '<code class="wy-code">$1</code>');
      s = s.replace(/\\*\\*([^*]+)\\*\\*/g, '<strong class="wy-strong">$1</strong>');
      s = s.replace(/\\*([^*]+)\\*/g, '<em>$1</em>');
      s = s.replace(/(https?:\\/\\/[^\\s<）)”"]+)/g, '<a class="wy-link" href="$1" target="_blank" rel="noopener">$1</a>');
      return s;
    }

    /* ========= ✅ 待办清单进度计算与交互 ========= */
    function updateTodoProgressUi() {
      const boxes = Array.from(document.querySelectorAll('#fullMdBox .wy-todo input[type="checkbox"]'));
      const total = boxes.length;
      const done = boxes.filter(b => b.checked).length;
      const pct = total > 0 ? Math.round((done / total) * 100) : 0;

      const textEl = document.getElementById('todoProgressText');
      if (textEl) textEl.textContent = \`已完成 \${done} / \${total} 项 (\${pct}%)\`;
      const fillEl = document.getElementById('todoProgressFill');
      if (fillEl) fillEl.style.width = pct + '%';
      const tocBadge = document.getElementById('tocBadge-todo');
      if (tocBadge) tocBadge.textContent = \`\${done}/\${total}\`;

      document.querySelectorAll('#fullMdBox .wy-todo').forEach(lbl => {
        const isDone = lbl.classList.contains('done');
        lbl.classList.toggle('hidden-done', hideCompletedTodos && isDone);
      });
    }

    function toggleTodoCheck(todoKey, cb) {
      try {
        localStorage.setItem(todoKey, cb.checked ? '1' : '0');
        const label = cb.closest('.wy-todo');
        if (label) label.classList.toggle('done', cb.checked);
        updateTodoProgressUi();
      } catch {}
    }

    function toggleHideCompletedTodos() {
      hideCompletedTodos = !hideCompletedTodos;
      localStorage.setItem('digesteer_hide_done_todos', hideCompletedTodos ? '1' : '0');
      const btn = document.getElementById('toggleHideDoneBtn');
      if (btn) btn.textContent = hideCompletedTodos ? '👁️ 显示全部待办' : '👁️ 隐藏已完成';
      updateTodoProgressUi();
    }

    function copyRemainingTodos() {
      const unchecked = [];
      document.querySelectorAll('#fullMdBox .wy-todo').forEach(lbl => {
        const cb = lbl.querySelector('input[type="checkbox"]');
        const body = lbl.querySelector('.wy-todo-body');
        if (cb && !cb.checked && body) {
          unchecked.push('- [ ] ' + body.innerText.trim());
        }
      });
      if (!unchecked.length) {
        showToast('全部待办已完成', '当前没有未完成的待办事项！', 'success');
        return;
      }
      navigator.clipboard.writeText(unchecked.join('\\n'));
      showToast('已复制待办清单', \`已将 \${unchecked.length} 条未完成待办复制到剪贴板\`, 'success');
    }

    function copyCurrentDigestMarkdown() {
      const digests = appState?.digests || [];
      const latest = (selectedDigestId ? digests.find(d => Number(d.id) === Number(selectedDigestId)) : null) || digests[0];
      if (!latest || !latest.markdownSummary) {
        showToast('暂无可复制内容', '请先生成一期日报', 'warn');
        return;
      }
      navigator.clipboard.writeText(latest.markdownSummary);
      showToast('已复制 Markdown 全文', \`第 #\${latest.id} 期深度日报已复制到剪贴板\`, 'success');
    }

    /**
     * 将 AI 日报的 Markdown 源码实时渲染为所见即所得 (WYSIWYG) 富文本 HTML，
     * 并在每个议题标题右侧直接内嵌【🔍 溯源并回复】按钮，同时生成章节锚点供左侧目录跳转
     */
    function renderMarkdownToWysiwyg(md, digestId, items = []) {
      if (!md) return '';
      const lines = String(md).split(/\\r?\\n/);
      const out = [];
      let inItemBlock = false;
      let todoProgressInserted = false;

      // 建立从 (群名/标题) 到原消息溯源参数的快速映射
      const findTraceTarget = (grpNameRaw, titleRaw) => {
        const gClean = String(grpNameRaw || '').trim();
        const tClean = String(titleRaw || '').trim();
        let matched = items.find(it => it.title === tClean || (it.groupName === gClean && tClean.includes(it.title)));
        if (!matched && gClean) {
          matched = items.find(it => it.groupName === gClean || it.groupName.includes(gClean) || gClean.includes(it.groupName));
        }
        if (matched && matched.groupId) {
          return {
            groupId: matched.groupId,
            groupName: matched.groupName || gClean,
            idsStr: (matched.keyMessageIds || []).join(','),
            count: (matched.keyMessageIds || []).length
          };
        }
        // 从全局已发现群列表中匹配群号
        const grpInState = (appState?.groups || []).find(
          g => g.group_name === gClean || g.group_name.includes(gClean) || gClean.includes(g.group_name)
        );
        if (grpInState) {
          return {
            groupId: grpInState.group_id,
            groupName: grpInState.group_name,
            idsStr: '',
            count: 0
          };
        }
        return null;
      };

      const closeItemBlock = () => {
        if (inItemBlock) {
          out.push('</div>');
          inItemBlock = false;
        }
      };

      const getSectionAnchorId = (headingText) => {
        if (/导读|概览/.test(headingText)) return 'sec-overview';
        if (/待办|Checklist/i.test(headingText)) return 'sec-todo';
        if (/必看|通知|Urgent/i.test(headingText)) return 'sec-urgent';
        if (/竞赛|科创|Competition/i.test(headingText)) return 'sec-competition';
        if (/AI|技术|知识|Insights/i.test(headingText)) return 'sec-ai';
        if (/讨论|话题|Discussion/i.test(headingText)) return 'sec-discussion';
        return '';
      };

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        if (!trimmed) {
          closeItemBlock();
          continue;
        }

        if (trimmed.startsWith('# ')) {
          closeItemBlock();
          out.push('<div class="wy-h1" id="sec-top">' + formatInlineMarkdown(trimmed.slice(2)) + '</div>');
          continue;
        }

        if (trimmed.startsWith('## ')) {
          closeItemBlock();
          const hText = trimmed.slice(3).trim();
          const secId = getSectionAnchorId(hText);
          out.push(
            '<div class="wy-h2" ' + (secId ? 'id="' + secId + '"' : '') + '>' +
              '<span>' + formatInlineMarkdown(hText) + '</span>' +
            '</div>'
          );
          if (secId === 'sec-todo' && !todoProgressInserted) {
            todoProgressInserted = true;
            out.push(
              '<div class="todo-progress-bar-wrap">' +
                '<span class="mono" style="font-size:12px; font-weight:600; color:var(--text-primary);" id="todoProgressText">已完成 0 / 0 项 (0%)</span>' +
                '<div class="todo-progress-track"><div class="todo-progress-fill" id="todoProgressFill" style="width:0%"></div></div>' +
                '<div style="display:flex; gap:6px;">' +
                  '<button class="icon-btn" style="height:26px; font-size:11.5px;" id="toggleHideDoneBtn" onclick="toggleHideCompletedTodos()">' +
                    (hideCompletedTodos ? '👁️ 显示全部待办' : '👁️ 隐藏已完成') +
                  '</button>' +
                  '<button class="icon-btn" style="height:26px; font-size:11.5px;" onclick="copyRemainingTodos()">📋 复制未办项</button>' +
                '</div>' +
              '</div>'
            );
          }
          continue;
        }

        if (trimmed.startsWith('### ')) {
          closeItemBlock();
          out.push('<div class="wy-h3">' + formatInlineMarkdown(trimmed.slice(4)) + '</div>');
          continue;
        }

        if (trimmed.startsWith('> ')) {
          closeItemBlock();
          out.push('<div class="wy-quote">' + formatInlineMarkdown(trimmed.slice(2)) + '</div>');
          continue;
        }

        // 1. [ ] 待办清单项
        const todoMatch = trimmed.match(/^(\\d+)\\.\\s*\\[([ xX]?)\\]\\s*(.+)$/);
        if (todoMatch) {
          closeItemBlock();
          const num = todoMatch[1];
          const defaultChecked = todoMatch[2].toLowerCase() === 'x';
          const bodyText = todoMatch[3];
          const todoKey = 'digesteer_todo_' + (digestId || '0') + '_' + num;
          const savedVal = localStorage.getItem(todoKey);
          const isChecked = savedVal !== null ? savedVal === '1' : defaultChecked;

          // 检查待办项中的 [群名/类别] 是否能匹配到群聊以便一键溯源
          const bracketMatch = bodyText.match(/^\\[([^\\]/]+)(?:\\/[^\\]]+)?\\]/);
          const todoTrace = bracketMatch ? findTraceTarget(bracketMatch[1], bodyText) : null;
          const todoTraceBtnHtml = todoTrace
            ? \`<button class="wy-trace-btn mono" onclick="event.preventDefault();event.stopPropagation();openContext('\${escapeHtmlStr(todoTrace.groupId)}', '\${encodeURIComponent(todoTrace.groupName)}', '\${escapeHtmlStr(todoTrace.idsStr)}')" title="查看该待办对应的原群聊天记录并直接回复">🔍 溯源</button>\`
            : '';

          out.push(
            '<label class="wy-todo ' + (isChecked ? 'done' : '') + (hideCompletedTodos && isChecked ? ' hidden-done' : '') + '">' +
              '<input type="checkbox" ' + (isChecked ? 'checked' : '') + ' onchange="toggleTodoCheck(\\'' + todoKey + '\\', this)" />' +
              '<span class="wy-todo-num">' + num + '.</span>' +
              '<span class="wy-todo-body">' + formatInlineMarkdown(bodyText) + '</span>' +
              todoTraceBtnHtml +
            '</label>'
          );
          continue;
        }

        // 缩进子列表项
        if (/^\\s{2,}-\\s+/.test(line)) {
          const subContent = trimmed.replace(/^-\\s+/, '');
          const isAction = /^(⚡|📌|🔗)/.test(subContent);
          out.push(
            '<div class="' + (isAction ? 'wy-sub-action' : 'wy-sub-item') + '">' +
              formatInlineMarkdown(subContent) +
            '</div>'
          );
          continue;
        }

        // 顶层议题项: "- **[群名] 标题** *(时间)*" -> 自动挂载内联【🔍 溯源并回复】按钮
        const itemHeadMatch = trimmed.match(/^-\\s+\\*\\*\\[([^\\]]+)\\]\\s*([^*]+)\\*\\*\\s*(?:\\*\\(([^)]+)\\)\\*)?(.*)$/);
        if (itemHeadMatch) {
          closeItemBlock();
          inItemBlock = true;
          const rawGrpName = itemHeadMatch[1].trim();
          const rawTitle = itemHeadMatch[2].trim();
          const grpName = escapeHtmlStr(rawGrpName);
          const titleStr = formatInlineMarkdown(rawTitle);
          const timeStr = itemHeadMatch[3] ? escapeHtmlStr(itemHeadMatch[3].trim()) : '';
          const traceTarget = findTraceTarget(rawGrpName, rawTitle);
          const traceBtnHtml = traceTarget
            ? \`<button class="wy-trace-btn mono" onclick="openContext('\${escapeHtmlStr(traceTarget.groupId)}', '\${encodeURIComponent(traceTarget.groupName)}', '\${escapeHtmlStr(traceTarget.idsStr)}')">🔍 溯源并回复\${traceTarget.count ? ' [' + traceTarget.count + ']' : ''} ↗</button>\`
            : '';

          out.push(
            '<div class="wy-item-block">' +
              '<div class="wy-item-head">' +
                '<span class="wy-group-tag">' + grpName + '</span>' +
                '<span class="wy-item-title">' + titleStr + '</span>' +
                '<div class="wy-item-right">' +
                  (timeStr ? '<span class="wy-item-time mono">🕒 ' + timeStr + '</span>' : '') +
                  traceBtnHtml +
                '</div>' +
              '</div>'
          );
          continue;
        }

        if (trimmed.startsWith('- ')) {
          closeItemBlock();
          out.push('<div class="wy-note-item">' + formatInlineMarkdown(trimmed.slice(2)) + '</div>');
          continue;
        }

        closeItemBlock();
        out.push('<p class="wy-p">' + formatInlineMarkdown(trimmed) + '</p>');
      }

      closeItemBlock();
      return out.join('');
    }

    // 溯源抽屉快捷回复状态
    let drawerGroupId = '';
    let drawerGroupName = '';
    let drawerHighlightIds = '';
    let drawerReplyMsgId = null;
    let drawerAtUserId = null;
    let isSendingChat = false;

    function safeDecode(str) {
      if (!str) return '';
      try { return decodeURIComponent(str); } catch { return String(str); }
    }

    function formatChatTextHtml(rawText) {
      return escapeHtmlStr(rawText || '').replace(/\\r?\\n/g, '<br/>');
    }

    /* ========= 主题、字号、视图与侧边栏控制 ========= */
    function toggleTheme() {
      const root = document.documentElement;
      const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('digesteer_theme', next);
      showToast(next === 'dark' ? '已切换至 Apple 深空黑模式' : '已切换至 Cupertino 暖白纸张模式', '', 'info', 2000);
    }

    function cycleFontSize() {
      const root = document.documentElement;
      const cur = root.getAttribute('data-font') || 'normal';
      const order = ['normal', 'large', 'xlarge'];
      const labels = { normal: 'Aa 标准', large: 'Aa 大字', xlarge: 'Aa 超大' };
      const next = order[(order.indexOf(cur) + 1) % order.length];
      root.setAttribute('data-font', next);
      localStorage.setItem('digesteer_font', next);
      const btn = document.getElementById('fontBtn');
      if (btn) btn.textContent = labels[next];
    }

    function toggleSidebar() {
      const sb = document.getElementById('digestSidebar');
      if (!sb) return;
      sb.classList.toggle('collapsed');
      localStorage.setItem('digesteer_sidebar_collapsed', sb.classList.contains('collapsed') ? '1' : '0');
    }

    function setViewMode(mode, btn) {
      currentViewMode = mode;
      localStorage.setItem('digesteer_view_mode', mode);
      document.querySelectorAll('#viewModeNav .seg-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
      applyViewModeVisibility();
    }

    function applyViewModeVisibility() {
      const reportWrap = document.getElementById('reportArticleWrap');
      const cardsWrap = document.getElementById('cardsGridWrap');
      if (reportWrap) reportWrap.style.display = (currentViewMode === 'cards') ? 'none' : 'block';
      if (cardsWrap) cardsWrap.style.display = (currentViewMode === 'report') ? 'none' : 'grid';
    }

    (function initPreferences() {
      const savedTheme = localStorage.getItem('digesteer_theme');
      if (savedTheme) document.documentElement.setAttribute('data-theme', savedTheme);
      const savedFont = localStorage.getItem('digesteer_font');
      if (savedFont) {
        document.documentElement.setAttribute('data-font', savedFont);
        const labels = { normal: 'Aa 标准', large: 'Aa 大字', xlarge: 'Aa 超大' };
        const btn = document.getElementById('fontBtn');
        if (btn && labels[savedFont]) btn.textContent = labels[savedFont];
      }
      if (localStorage.getItem('digesteer_sidebar_collapsed') === '1') {
        document.getElementById('digestSidebar')?.classList.add('collapsed');
      }
      document.querySelectorAll('#viewModeNav .seg-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('viewBtn-' + currentViewMode)?.classList.add('active');
    })();

    function switchTab(tabId, btn) {
      ['digest', 'stream', 'groups', 'settings'].forEach(id => {
        const el = document.getElementById('tab-' + id);
        if (el) el.style.display = (id === tabId) ? 'flex' : 'none';
      });
      document.querySelectorAll('.app-topbar .seg-nav .seg-btn').forEach(b => b.classList.remove('active'));
      if (btn) btn.classList.add('active');
    }

    function setDigestFilter(filter, btn) {
      currentDigestFilter = filter;
      document.querySelectorAll('#categoryChips .chip').forEach(c => c.classList.remove('active'));
      if (btn) btn.classList.add('active');
      renderDigestTab(true);
    }

    function setStreamFilter(filter, btn) {
      currentStreamFilter = filter;
      btn.parentElement.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      renderStreamTab();
    }

    function scrollToSection(secId, btn) {
      if (currentViewMode === 'cards') {
        setViewMode('both', document.getElementById('viewBtn-both'));
      }
      const target = document.getElementById(secId);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        document.querySelectorAll('#tocContainer .toc-item').forEach(b => b.classList.remove('active'));
        if (btn) btn.classList.add('active');
      }
    }

    window.addEventListener('keydown', (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return;
      if (e.key === '1') switchTab('digest', document.getElementById('tabBtn-digest'));
      if (e.key === '2') switchTab('stream', document.getElementById('tabBtn-stream'));
      if (e.key === '3') switchTab('groups', document.getElementById('tabBtn-groups'));
      if (e.key === '4') switchTab('settings', document.getElementById('tabBtn-settings'));
      if (e.key === '[') toggleSidebar();
      if (e.key === 'Escape') {
        closeDrawer();
        closeConfirmModal();
      }
    });

    function formatChinaTime(ms) {
      try {
        return new Date(ms).toLocaleString('zh-CN', {
          timeZone: 'Asia/Shanghai',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        });
      } catch {
        const bj = new Date(Number(ms) + 8 * 3600000);
        return bj.toISOString().slice(5, 19).replace('T', ' ');
      }
    }

    async function fetchStatus() {
      try {
        const res = await fetch('/api/status');
        appState = await res.json();
        renderHeader();
        renderDigestTab(false);
        renderStreamTab();
        renderGroupsTab();
        populateSettings();
      } catch {}
    }

    function renderHeader() {
      const connDot = document.getElementById('connDot');
      const connText = document.getElementById('connText');
      const sbConnDot = document.getElementById('sbConnDot');
      const sbConnText = document.getElementById('sbConnText');
      const launchBtn = document.getElementById('launchNapCatBtn');
      if (appState.napcat.connected) {
        const nick = appState.napcat.selfNickname || appState.napcat.selfQqId;
        if (connDot) connDot.className = 'dot live';
        if (connText) connText.textContent = '共存中 · ' + nick;
        if (sbConnDot) sbConnDot.className = 'dot live';
        if (sbConnText) sbConnText.textContent = '共存 · ' + nick;
        if (launchBtn && !launchBtn.disabled) {
          launchBtn.textContent = '💬 官方 QQ';
        }
      } else {
        if (connDot) connDot.className = 'dot warn';
        if (connText) connText.textContent = 'QQ 待连接';
        if (sbConnDot) sbConnDot.className = 'dot warn';
        if (sbConnText) sbConnText.textContent = 'QQ 待连接';
        if (launchBtn && !launchBtn.disabled) {
          launchBtn.textContent = '⚡ 启动官方 QQ';
        }
      }

      const llmDot = document.getElementById('llmDot');
      const llmText = document.getElementById('llmText');
      const sbLlmDot = document.getElementById('sbLlmDot');
      const sbLlmText = document.getElementById('sbLlmText');
      if (appState.hasApiKey) {
        if (llmDot) llmDot.className = 'dot live';
        if (llmText) llmText.textContent = appState.config.llm.mainModel;
        if (sbLlmDot) sbLlmDot.className = 'dot live';
        if (sbLlmText) sbLlmText.textContent = appState.config.llm.mainModel;
      } else {
        if (llmDot) llmDot.className = 'dot warn';
        if (llmText) llmText.textContent = '未配置 Key';
        if (sbLlmDot) sbLlmDot.className = 'dot warn';
        if (sbLlmText) sbLlmText.textContent = '未配置 Key';
      }

      const lanEl = document.getElementById('lanUrlText');
      if (lanEl) {
        lanEl.textContent = 'http://' + appState.lanIp + ':' + appState.port;
      }

      const genBtn = document.getElementById('genBtn');
      const w = appState.watermark;
      if (genBtn && !genBtn.disabled && w) {
        if (w.unsummarizedKeptCount > 0) {
          genBtn.textContent = '✦ 总结新增 (' + w.unsummarizedKeptCount + '条)';
        } else {
          genBtn.textContent = '✦ 暂无新消息';
        }
      }
    }

    function selectDigestPeriod(id) {
      selectedDigestId = Number(id);
      renderDigestTab(true);
      const scrollCanvas = document.getElementById('digestMainScroll');
      if (scrollCanvas) scrollCanvas.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function reRunCurrentDigest() {
      const digests = appState?.digests || [];
      const latest = (selectedDigestId ? digests.find(d => Number(d.id) === Number(selectedDigestId)) : null) || digests[0];
      if (!latest) return;
      showConfirmModal(
        '重新提炼第 #' + latest.id + ' 期日报',
        '确定要让 AI 重新通盘阅读并生成第 #' + latest.id + ' 期的时间段消息吗？',
        () => generateNow(latest.id)
      );
    }

    /* ========= 📅 智能日报工作台渲染 ========= */
    function renderDigestTab(forceRender = false) {
      if (!appState) return;
      const digests = appState.digests || [];
      const w = appState.watermark || {
        lastDigestId: null,
        lastSummarizedAt: null,
        lastMessageTs: 0,
        unsummarizedTotalCount: 0,
        unsummarizedKeptCount: 0,
        alreadySummarizedCount: 0,
      };

      const totalCaptured = (appState.groups || []).reduce((acc, g) => acc + Number(g.total_count || 0), 0);
      const totalKept = (appState.groups || []).reduce((acc, g) => acc + Number(g.kept_count || 0), 0);

      const latest =
        (selectedDigestId ? digests.find(d => Number(d.id) === Number(selectedDigestId)) : null) ||
        digests[0];

      // 更新左侧边栏顶部实时指标（轻量文本更新，不打断滚动）
      const unsumEl = document.getElementById('metricUnsum');
      if (unsumEl) {
        unsumEl.textContent = w.unsummarizedKeptCount + ' 条';
        unsumEl.style.color = w.unsummarizedKeptCount > 0 ? 'var(--ok)' : 'var(--text-secondary)';
      }
      const topicsEl = document.getElementById('metricTopics');
      if (topicsEl) {
        topicsEl.textContent = (latest?.stats?.valuableChunks ?? (latest?.items || []).length) + ' 项';
      }
      const periodBadgeEl = document.getElementById('sidebarPeriodBadge');
      if (periodBadgeEl) {
        periodBadgeEl.textContent = latest ? ('#' + latest.id + ' 期') : '#--';
      }
      const wmTextEl = document.getElementById('sidebarWatermarkText');
      if (wmTextEl) {
        const lastMarkStr = w.lastSummarizedAt ? formatChinaTime(w.lastSummarizedAt) : '尚未打标';
        wmTextEl.innerHTML = \`⏱️ 锚点: <b>\${lastMarkStr}</b><br/>已打标归档 <b>\${w.alreadySummarizedCount}</b> 条 (绝不重复总结)\`;
      }

      const container = document.getElementById('digestContainer');
      if (!latest) {
        lastDigestRenderSignature = 'empty_' + totalCaptured;
        container.innerHTML = \`
          <div class="panel-card" style="text-align:center; padding:64px 24px;">
            <div class="mono" style="font-size:11px; color:var(--accent); margin-bottom:8px;">READY FOR CURATION</div>
            <h3 style="font-size:21px; margin-bottom:8px;">已捕获 \${totalCaptured} 条群聊消息，随时可生成深度日报</h3>
            <p style="color:var(--text-secondary); font-size:13.5px; max-width:480px; margin:0 auto 22px;">
              点击下方按钮，系统将把保留的 \${totalKept} 条有效群消息 100% 原汁原味发送给 AI 提炼深度简报与待办清单。
            </p>
            <button class="btn btn-primary" onclick="generateNow()">✦ 立即生成今日 AI 日报</button>
          </div>
        \`;
        return;
      }

      const q = (document.getElementById('digestSearch')?.value || '').trim().toLowerCase();
      const nextSig = [
        latest.id,
        latest.createdAt,
        (latest.items || []).length,
        (latest.markdownSummary || '').length,
        digests.length,
        currentDigestFilter,
        q
      ].join('||');

      if (!forceRender && nextSig === lastDigestRenderSignature && document.getElementById('fullMdBox')) {
        return;
      }
      const mainScroll = document.getElementById('digestMainScroll');
      const prevScrollTop = mainScroll ? mainScroll.scrollTop : 0;
      lastDigestRenderSignature = nextSig;

      const allItems = latest.items || [];
      const urgentCnt = allItems.filter(i => i.category === 'urgent').length;
      const compCnt = allItems.filter(i => i.category === 'competition').length;
      const aiCnt = allItems.filter(i => i.category === 'ai_knowledge' || i.category === 'highlight').length;
      const discCnt = allItems.filter(i => i.category === 'discussion').length;

      // 渲染左侧章节快速跳转目录
      const tocContainer = document.getElementById('tocContainer');
      if (tocContainer) {
        tocContainer.innerHTML = \`
          <button class="toc-item active" onclick="scrollToSection('sec-top', this)">
            <span>🧭 全局深度导读</span>
            <span class="toc-badge mono">TOP</span>
          </button>
          <button class="toc-item" onclick="scrollToSection('sec-todo', this)">
            <span>✅ 集中待办清单</span>
            <span class="toc-badge mono" id="tocBadge-todo">--</span>
          </button>
          <button class="toc-item" onclick="scrollToSection('sec-urgent', this)">
            <span>🚨 必看通知与作业</span>
            <span class="toc-badge mono">\${urgentCnt}</span>
          </button>
          <button class="toc-item" onclick="scrollToSection('sec-competition', this)">
            <span>🏆 学科竞赛与科创</span>
            <span class="toc-badge mono">\${compCnt}</span>
          </button>
          <button class="toc-item" onclick="scrollToSection('sec-ai', this)">
            <span>🤖 AI 与技术干货</span>
            <span class="toc-badge mono">\${aiCnt}</span>
          </button>
          <button class="toc-item" onclick="scrollToSection('sec-discussion', this)">
            <span>💬 热门讨论与校园</span>
            <span class="toc-badge mono">\${discCnt}</span>
          </button>
          <button class="toc-item" onclick="scrollToSection('cardsGridWrap', this)">
            <span>🗂️ 底部灵感卡片流</span>
            <span class="toc-badge mono">\${allItems.length}</span>
          </button>
        \`;
      }

      // 渲染左侧历史期数列表
      const periodListEl = document.getElementById('periodListContainer');
      if (periodListEl) {
        periodListEl.innerHTML = digests.map(d => {
          const isAct = Number(d.id) === Number(latest.id);
          const rng = d.stats?.windowRangeStr ? d.stats.windowRangeStr.replace(' (北京时间 UTC+8)', '') : d.dateStr;
          return \`
            <button class="period-item \${isAct ? 'active' : ''}" onclick="selectDigestPeriod(\${d.id})">
              <div class="period-title">
                <span>第 #\${d.id} 期日报</span>
                <span class="toc-badge mono">\${(d.items || []).length}项</span>
              </div>
              <div class="period-sub mono">\${escapeHtmlStr(rng)}</div>
            </button>
          \`;
        }).join('');
      }

      const filteredItems = allItems.filter(item => {
        if (currentDigestFilter !== 'all') {
          if (currentDigestFilter === 'ai_knowledge') {
            if (item.category !== 'ai_knowledge' && item.category !== 'highlight') return false;
          } else if (item.category !== currentDigestFilter) {
            return false;
          }
        }
        if (q) {
          const hay = (item.groupName + ' ' + item.title + ' ' + item.summary + ' ' + (item.actionRequired || '')).toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });

      const cardsHtml = filteredItems.map(item => {
        let cardCls = '';
        let lvlBadge = '<span class="level-tag level-disc mono">💬 热门讨论</span>';
        if (item.category === 'urgent') {
          cardCls = 'urgent';
          lvlBadge = '<span class="level-tag level-urgent mono">🚨 必看通知与待办</span>';
        } else if (item.category === 'competition') {
          cardCls = 'competition';
          lvlBadge = '<span class="level-tag level-comp mono">🏆 学科竞赛与科创</span>';
        } else if (item.category === 'ai_knowledge' || item.category === 'highlight') {
          cardCls = 'ai_knowledge';
          lvlBadge = '<span class="level-tag level-ai mono">🤖 AI 与技术干货</span>';
        }
        const idsStr = (item.keyMessageIds || []).join(',');
        const encodedGName = encodeURIComponent(item.groupName || '');
        const safeGNameHtml = escapeHtmlStr(item.groupName || '');
        const safeTitleHtml = escapeHtmlStr(item.title || '');
        const safeSummaryHtml = escapeHtmlStr(item.summary || '');
        const safeActionHtml = escapeHtmlStr(item.actionRequired || '');
        return \`
          <article class="intel-card \${cardCls}">
            <div style="display:flex; flex-direction:column; gap:10px;">
              <div class="intel-meta">
                <span class="group-badge" title="\${safeGNameHtml}">\${safeGNameHtml}</span>
                \${lvlBadge}
              </div>
              <h3 class="intel-title">\${safeTitleHtml}</h3>
              <p class="intel-summary">\${safeSummaryHtml}</p>
              \${safeActionHtml ? \`<div class="intel-action">⚡ <b>待办 / 行动指南:</b> \${safeActionHtml}</div>\` : ''}
            </div>
            <div class="intel-footer mono">
              <span>🕒 \${escapeHtmlStr(item.timeRange || '')}</span>
              <button class="btn mono" style="height:28px; padding:0 10px; font-size:11.5px;"
                onclick="openContext('\${escapeHtmlStr(item.groupId)}', '\${encodedGName}', '\${escapeHtmlStr(idsStr)}')">
                🔍 溯源并回复 [\${(item.keyMessageIds || []).length}] ↗
              </button>
            </div>
          </article>
        \`;
      }).join('');

      const s = latest.stats || {};
      const windowBadge = s.windowRangeStr
        ? \`<span class="mono" style="padding:2px 8px; border-radius:6px; background:var(--accent-soft); color:var(--accent); font-size:11px;">⏱️ \${escapeHtmlStr(s.windowRangeStr)}</span>\`
        : '';

      container.innerHTML = \`
        <div id="reportArticleWrap" style="display:\${currentViewMode === 'cards' ? 'none' : 'block'};">
          <article class="wysiwyg-article">
            <div class="report-header-banner">
              <div>
                <div class="report-kicker mono">
                  <span>✦ AI DAILY DIGEST ISSUE #\${latest.id}</span>
                  <span>·</span>
                  <span>生成于北京时间 \${formatChinaTime(latest.createdAt)}</span>
                </div>
                <div style="font-size:13px; color:var(--text-secondary);">
                  本批次捕获 <b>\${s.totalMessages || 0}</b> 条群消息 · 过滤噪音 <b>\${s.l1FilteredNoise || 0}</b> 条 · <b>100% 零截断阅读 \${s.keptForAi || 0} 条 (\${Number(s.rawPureTextChars || 0).toLocaleString()} 字)</b> · 预计节省 <b>\${s.estimatedSavedMinutes || 15} 分钟</b> 爬楼时间
                </div>
              </div>
              \${windowBadge}
            </div>
            <div id="fullMdBox">\${renderMarkdownToWysiwyg(latest.markdownSummary || '', latest.id, allItems)}</div>
          </article>
        </div>

        <div id="cardsGridWrap" class="digest-grid" style="display:\${currentViewMode === 'report' ? 'none' : 'grid'}; scroll-margin-top:72px;">
          \${cardsHtml || '<div class="panel-card" style="grid-column:1/-1;text-align:center;color:var(--text-secondary);">当前筛选条件下暂无卡片条目</div>'}
        </div>
      \`;

      updateTodoProgressUi();
      if (mainScroll && prevScrollTop > 0 && !forceRender) {
        mainScroll.scrollTop = prevScrollTop;
      }
    }

    function renderStreamTab() {
      if (!appState) return;
      const list = document.getElementById('streamList');
      const msgs = (appState.recentMessages || []).filter(m => {
        if (currentStreamFilter === 'unsummarized') return !m.summarized_at && m.filter_status === 'kept';
        if (currentStreamFilter === 'summarized') return Boolean(m.summarized_at && m.summarized_at > 0);
        if (currentStreamFilter === 'kept') return m.filter_status === 'kept';
        if (currentStreamFilter === 'high') return m.is_high_priority === 1;
        if (currentStreamFilter === 'noise') return m.filter_status === 'filtered_noise';
        return true;
      });

      const streamSig = currentStreamFilter + '_' + msgs.length + '_' + (msgs[0]?.message_id || '') + '_' + (msgs[0]?.summarized_at || '');
      if (streamSig === lastStreamRenderSignature && list.children.length > 0) {
        return;
      }
      lastStreamRenderSignature = streamSig;

      if (!msgs.length) {
        list.innerHTML = '<div style="padding:36px; text-align:center; color:var(--text-secondary);">当前筛选条件下暂无群聊消息</div>';
        return;
      }

      list.innerHTML = msgs.map(m => {
        const isNoise = m.filter_status === 'filtered_noise';
        const timeStr = formatChinaTime(m.timestamp);
        const sumBadge = m.summarized_at && m.summarized_at > 0
          ? \`<span class="level-tag level-ai mono" style="margin-right:4px;" title="已于北京时间 \${formatChinaTime(m.summarized_at)} 纳入第 #\${m.summarized_digest_id || ''} 期日报">🏷️ 已总结 #\${m.summarized_digest_id || ''}</span>\`
          : (!isNoise ? \`<span class="level-tag mono" style="background:var(--accent-soft);color:var(--accent);margin-right:4px;">🆕 待总结</span>\` : '');
        const statusHtml = m.is_high_priority
          ? \`\${sumBadge}<span class="level-tag level-urgent mono">🔥 \${escapeHtmlStr(m.priority_reason || 'HIGH')}</span>\`
          : isNoise
          ? \`<span class="level-tag level-disc mono">🗑️ \${escapeHtmlStr(m.filter_reason || 'NOISE')}</span>\`
          : \`\${sumBadge}<span class="level-tag mono" style="background:var(--ok-soft);color:var(--ok);">✅ 保留</span>\`;
        const encodedGName = encodeURIComponent(m.group_name || '');
        const safeGNameHtml = escapeHtmlStr(m.group_name || '');
        const safeSenderHtml = escapeHtmlStr(m.sender_name || '');
        const safeTextHtml = escapeHtmlStr(m.clean_text || '');
        return \`
          <div class="stream-row \${isNoise ? 'noise' : ''}" style="cursor:pointer;"
            onclick="openContext('\${escapeHtmlStr(m.group_id)}', '\${encodedGName}', '\${escapeHtmlStr(m.message_id)}')">
            <span class="mono" style="font-size:11.5px; color:var(--text-muted);">\${timeStr}</span>
            <span class="group-badge" title="\${safeGNameHtml}">\${safeGNameHtml}</span>
            <strong style="font-size:12.5px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">\${safeSenderHtml}</strong>
            <span style="color:var(--text-primary); word-break:break-all;">\${safeTextHtml}</span>
            <div style="text-align:right; white-space:nowrap;">\${statusHtml}</div>
          </div>
        \`;
      }).join('');
    }

    function renderGroupsTab() {
      if (!appState) return;
      const el = document.getElementById('groupsList');
      if (el && el.contains(document.activeElement)) return;
      const groups = appState.groups || [];
      const grpSig = groups.map(g => g.group_id + ':' + g.total_count + ':' + (g.unsummarized_kept_count || 0)).join('|');
      if (grpSig === lastGroupsRenderSignature && el.children.length > 0) return;
      lastGroupsRenderSignature = grpSig;
      if (!groups.length) {
        el.innerHTML = '<p style="color:var(--text-secondary);">等待群聊消息流入后自动展示...</p>';
        return;
      }
      const monitored = appState.config.filter.monitoredGroups || {};
      el.innerHTML = groups.map(g => {
        const cfg = monitored[g.group_id] || { enabled: true, customFocusPrompt: '' };
        const checked = cfg.enabled !== false ? 'checked' : '';
        const unsumCnt = Number(g.unsummarized_kept_count || 0);
        const safeGNameHtml = escapeHtmlStr(g.group_name || '');
        return \`
          <div class="intel-card">
            <div>
              <div class="intel-meta" style="margin-bottom:8px;">
                <strong style="font-size:14.5px;">\${safeGNameHtml}</strong>
                <label class="mono" style="font-size:11.5px; display:flex; align-items:center; gap:6px; cursor:pointer;">
                  <input type="checkbox" id="grp_en_\${escapeHtmlStr(g.group_id)}" \${checked} />
                  订阅中
                </label>
              </div>
              <div class="mono" style="font-size:11px; color:var(--text-muted); margin-bottom:12px;">
                ID: \${escapeHtmlStr(g.group_id)} · 累计: \${g.total_count} · 有效: \${g.kept_count} · <span style="color:\${unsumCnt > 0 ? 'var(--ok)' : 'var(--text-muted)'}">待总结: \${unsumCnt}</span>
              </div>
              <input class="field-input" style="margin-bottom:0;" id="grp_focus_\${escapeHtmlStr(g.group_id)}"
                value="\${escapeHtmlStr(cfg.customFocusPrompt || '')}"
                placeholder="专属 AI 关注提示词 (如: 重点提取作业截止时间与课程通知)" />
            </div>
          </div>
        \`;
      }).join('');
    }

    let settingsInitialized = false;
    function populateSettings() {
      if (!appState || settingsInitialized) return;
      settingsInitialized = true;
      const c = appState.config;
      document.getElementById('cfg_llm_baseUrl').value = c.llm.baseUrl || '';
      document.getElementById('cfg_llm_apiKey').value = c.llm.apiKey || '';
      document.getElementById('cfg_llm_fastModel').value = c.llm.fastModel || '';
      document.getElementById('cfg_llm_mainModel').value = c.llm.mainModel || '';
      document.getElementById('cfg_push_enabled').value = String(Boolean(c.mobilePush.enabled));
      document.getElementById('cfg_push_type').value = c.mobilePush.type || 'bark';
      document.getElementById('cfg_push_url').value = c.mobilePush.webhookUrl || '';
      document.getElementById('cfg_napcat_wsUrl').value = c.napcat.wsUrl || '';
      document.getElementById('cfg_filter_keywords').value = (c.filter.highPriorityKeywords || []).join(',');
    }

    function applyPreset(baseUrl, fastModel, mainModel) {
      document.getElementById('cfg_llm_baseUrl').value = baseUrl;
      document.getElementById('cfg_llm_fastModel').value = fastModel;
      document.getElementById('cfg_llm_mainModel').value = mainModel;
      showToast('已填入预设配置', '请点击下方保存按钮使配置生效', 'info', 2500);
    }

    async function testLlmApi() {
      const btn = document.getElementById('testApiBtn');
      const resEl = document.getElementById('testApiResult');
      btn.disabled = true;
      resEl.style.color = 'var(--text-secondary)';
      resEl.textContent = '⏳ 正在验证远程大模型接口...';
      try {
        const res = await fetch('/api/test-llm', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            baseUrl: document.getElementById('cfg_llm_baseUrl').value,
            apiKey: document.getElementById('cfg_llm_apiKey').value,
            fastModel: document.getElementById('cfg_llm_fastModel').value,
            mainModel: document.getElementById('cfg_llm_mainModel').value,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          resEl.style.color = 'var(--ok)';
          resEl.textContent = '✅ 连通成功: ' + data.reply;
          showToast('AI 引擎连通成功', data.reply, 'success');
        } else {
          resEl.style.color = 'var(--urgent)';
          resEl.textContent = '❌ 失败: ' + data.error;
          showToast('API 连通失败', data.error, 'error');
        }
      } catch (e) {
        resEl.style.color = 'var(--urgent)';
        resEl.textContent = '❌ 网络请求异常';
      } finally {
        btn.disabled = false;
      }
    }

    async function saveSettings() {
      const payload = {
        llm: {
          baseUrl: document.getElementById('cfg_llm_baseUrl').value,
          apiKey: document.getElementById('cfg_llm_apiKey').value,
          fastModel: document.getElementById('cfg_llm_fastModel').value,
          mainModel: document.getElementById('cfg_llm_mainModel').value,
        },
        mobilePush: {
          enabled: document.getElementById('cfg_push_enabled').value === 'true',
          type: document.getElementById('cfg_push_type').value,
          webhookUrl: document.getElementById('cfg_push_url').value,
        },
        napcat: {
          wsUrl: document.getElementById('cfg_napcat_wsUrl').value,
        },
        filter: {
          highPriorityKeywords: document.getElementById('cfg_filter_keywords').value.split(',').map(s => s.trim()).filter(Boolean),
        }
      };
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      settingsInitialized = false;
      showToast('系统配置已保存', '全部远程 AI 与推送规则已生效', 'success');
      fetchStatus();
    }

    async function saveGroupRules() {
      const groups = appState.groups || [];
      const monitoredGroups = { ...(appState.config.filter.monitoredGroups || {}) };
      for (const g of groups) {
        const en = document.getElementById('grp_en_' + g.group_id)?.checked ?? true;
        const focus = document.getElementById('grp_focus_' + g.group_id)?.value ?? '';
        monitoredGroups[g.group_id] = {
          groupId: g.group_id,
          groupName: g.group_name,
          enabled: en,
          customFocusPrompt: focus,
        };
      }
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filter: { monitoredGroups } }),
      });
      showToast('群聊订阅配置已保存', \`已更新 \${groups.length} 个群聊的订阅与专属提示词\`, 'success');
      fetchStatus();
    }

    /* ========= ✦ AI 日报生成 (带实时进度横幅与 Toast，无原生弹窗) ========= */
    async function generateNow(forceDigestId) {
      switchTab('digest', document.getElementById('tabBtn-digest'));
      const btn = document.getElementById('genBtn');
      const banner = document.getElementById('aiProgressBanner');
      const titleEl = document.getElementById('aiProgressTitle');
      const timerEl = document.getElementById('aiProgressTimer');

      const unsumCnt = appState?.watermark?.unsummarizedKeptCount || 0;
      if (titleEl) {
        titleEl.textContent = forceDigestId
          ? \`正在重新提炼第 #\${forceDigestId} 期群聊记录...\`
          : \`正在通盘阅读 \${unsumCnt > 0 ? unsumCnt + ' 条' : ''}新增群聊消息并生成深度日报...\`;
      }
      if (banner) banner.style.display = 'flex';

      const startMs = Date.now();
      if (aiTimerInterval) clearInterval(aiTimerInterval);
      aiTimerInterval = setInterval(() => {
        if (timerEl) timerEl.textContent = ((Date.now() - startMs) / 1000).toFixed(1) + 's';
      }, 100);

      btn.textContent = '⏳ AI 深度提炼中...';
      btn.disabled = true;
      try {
        const res = await fetch('/api/generate-digest', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hours: 36,
            forceReSummarizeDigestId: forceDigestId || undefined,
          }),
        });
        const data = await res.json();
        if (!data.ok) {
          showToast('生成日报未完成', data.error || '请检查远程 AI API 是否可用', 'error', 5500);
        } else if (data.noNewMessages) {
          showToast('暂无新增群聊消息', data.message || '自上次总结时间标记以来暂无新消息，无需重复总结', 'info', 4200);
        } else if (data.report?.id) {
          selectedDigestId = data.report.id;
          showToast(
            \`第 #\${data.report.id} 期深度日报已生成\`,
            \`共提炼 \${(data.report.items || []).length} 个精品议题，已自动打上时间锚点\`,
            'success'
          );
        }
        await fetchStatus();
      } catch (e) {
        showToast('生成日报请求异常', '请确认后台服务与 AI 代理网关正在运行', 'error');
      } finally {
        if (aiTimerInterval) clearInterval(aiTimerInterval);
        if (banner) banner.style.display = 'none';
        btn.disabled = false;
        renderHeader();
      }
    }

    async function syncMissedMessages() {
      const btn = document.getElementById('syncBtn');
      if (btn) {
        btn.disabled = true;
        btn.textContent = '⏳ 同步中...';
      }
      try {
        const res = await fetch('/api/backfill', { method: 'POST' });
        const data = await res.json();
        await fetchStatus();
        if (data.newlyInserted > 0) {
          showToast('群消息同步完成', \`从 \${data.scannedGroups || 0} 个活跃群找回 \${data.newlyInserted} 条未读/漫游消息\`, 'success');
        } else {
          showToast('群消息已是最新', \`已扫描 \${data.scannedGroups || 0} 个活跃群，无漏收消息\`, 'info', 2600);
        }
      } catch {
        showToast('同步群消息失败', '请确认官方 QQ 共存服务在线', 'warn');
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.textContent = '🔄 同步消息';
        }
      }
    }

    async function launchCoexistQQ() {
      const btn = document.getElementById('launchNapCatBtn');
      const wasOnline = Boolean(appState?.napcat?.connected);
      btn.textContent = '⏳ 呼出中...';
      btn.disabled = true;
      try {
        const res = await fetch('/api/launch-napcat', { method: 'POST' });
        const data = await res.json();
        await fetchStatus();
        showToast(
          wasOnline ? '已呼出官方 QQ 窗口' : '正在启动共存版官方 QQ',
          data.message || '官方桌面 QQ 与本软件同号共存运行中',
          'success'
        );
      } finally {
        btn.disabled = false;
        renderHeader();
      }
    }

    /* ========= 🔍 抽屉溯源与直接回消息 ========= */
    async function openContext(groupId, encodedOrRawGroupName, idsStr) {
      const groupName = safeDecode(encodedOrRawGroupName);
      drawerGroupId = String(groupId);
      drawerGroupName = groupName;
      drawerHighlightIds = String(idsStr || '');
      clearDrawerReply();

      document.getElementById('ctxDrawer').style.display = 'flex';
      document.getElementById('drawerTitle').textContent = groupName + ' · 原消息上下文与回复';
      const body = document.getElementById('drawerBody');
      body.innerHTML = '<div class="mono" style="color:var(--text-secondary); padding:20px;">⏳ 正在调取该时段原群聊天记录...</div>';
      try {
        const res = await fetch('/api/context?groupId=' + encodeURIComponent(drawerGroupId) + '&ids=' + encodeURIComponent(drawerHighlightIds));
        const data = await res.json();
        const hlSet = new Set(data.highlightIds || []);
        const msgs = data.messages || [];
        if (!msgs.length) {
          body.innerHTML = '<div style="color:var(--text-muted); padding:28px; text-align:center;">暂无该群时段的本地上下文记录</div>';
          return;
        }
        body.innerHTML = msgs.map(m => {
          const isHl = hlSet.has(String(m.message_id));
          const timeStr = formatChinaTime(m.timestamp);
          const encodedSender = encodeURIComponent(m.sender_name || m.user_id || '');
          const safeSenderHtml = escapeHtmlStr(m.sender_name || m.user_id || '');
          const safeTextHtml = formatChatTextHtml(m.clean_text || '');
          const sumMark = m.summarized_at && m.summarized_at > 0
            ? \`<span class="mono" style="font-size:10px; color:var(--ai-tech);">🏷️#\${m.summarized_digest_id || ''}</span>\`
            : \`<span class="mono" style="font-size:10px; color:var(--ok);">🆕待总结</span>\`;
          return \`
            <div class="chat-bubble \${isHl ? 'anchor' : ''}" id="ctxMsg_\${escapeHtmlStr(m.message_id)}">
              <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:5px;">
                <strong style="font-size:12.5px;">\${safeSenderHtml}</strong>
                <div style="display:flex; align-items:center; gap:6px;">
                  \${sumMark}
                  <span class="mono" style="font-size:11px; color:var(--text-muted);">#\${escapeHtmlStr(m.message_id)} · \${timeStr}</span>
                  <button class="icon-btn mono" style="height:22px; padding:0 6px; font-size:10.5px;"
                    onclick="setDrawerReply('\${escapeHtmlStr(m.message_id)}', '\${escapeHtmlStr(m.user_id)}', '\${encodedSender}')">↩️ 引用</button>
                </div>
              </div>
              <div style="color:var(--text-primary); line-height:1.55; word-break:break-word;">\${safeTextHtml}</div>
            </div>
          \`;
        }).join('');

        // 自动滚动到高亮锚点消息，若无则滚到底部
        const firstAnchor = body.querySelector('.chat-bubble.anchor');
        if (firstAnchor) {
          firstAnchor.scrollIntoView({ block: 'center' });
        } else {
          body.scrollTop = body.scrollHeight;
        }
      } catch {
        body.innerHTML = '<div style="color:var(--urgent); padding:24px; text-align:center;">加载上下文失败，请重试</div>';
      }
    }

    function setDrawerReply(msgId, userId, encodedOrRawSender) {
      const senderName = safeDecode(encodedOrRawSender);
      drawerReplyMsgId = msgId;
      drawerAtUserId = userId;
      document.getElementById('drawerReplyBanner').style.display = 'flex';
      document.getElementById('drawerReplyText').textContent = '↩️ 正在引用回复 ' + senderName + ' (#' + msgId + ')';
      document.getElementById('drawerInput').focus();
    }

    function clearDrawerReply() {
      drawerReplyMsgId = null;
      drawerAtUserId = null;
      document.getElementById('drawerReplyBanner').style.display = 'none';
    }

    async function sendDrawerQuickReply() {
      if (!drawerGroupId || isSendingChat) return;
      const input = document.getElementById('drawerInput');
      const text = input.value.trim();
      if (!text) return;

      const replyIdSnap = drawerReplyMsgId;
      const atUserSnap = drawerAtUserId;
      const btn = document.getElementById('drawerSendBtn');
      isSendingChat = true;
      btn.disabled = true;
      btn.textContent = '发送中...';
      try {
        const res = await fetch('/api/chat/send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'group',
            targetId: drawerGroupId,
            text,
            replyToMessageId: replyIdSnap,
            atUserId: atUserSnap,
          }),
        });
        const data = await res.json();
        if (data.ok) {
          input.value = '';
          clearDrawerReply();
          showToast('已发送至群聊', drawerGroupName, 'success', 2200);
          setTimeout(() => openContext(drawerGroupId, encodeURIComponent(drawerGroupName), drawerHighlightIds), 350);
        } else {
          showToast('发送失败', data.error || '未知错误', 'error');
        }
      } catch {
        showToast('发送异常', '请检查本地连接状态', 'error');
      } finally {
        isSendingChat = false;
        btn.disabled = false;
        btn.textContent = '发送 ↵';
        input.focus();
      }
    }

    function closeDrawer() {
      document.getElementById('ctxDrawer').style.display = 'none';
    }

    fetchStatus();
    setInterval(fetchStatus, 8000);
  </script>
</body>
</html>`;
}
