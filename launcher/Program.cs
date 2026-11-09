using System;
using System.Diagnostics;
using System.Drawing;
using System.IO;
using System.Net;
using System.Net.Sockets;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Windows.Forms;
using Microsoft.Web.WebView2.Core;
using Microsoft.Web.WebView2.WinForms;

namespace QQAiDigestLauncher
{
    public class MainForm : Form
    {
        [DllImport("dwmapi.dll")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int attr, ref int attrValue, int attrSize);

        private WebView2 webView;
        private Label loadingLabel;
        private readonly string targetUrl;
        private bool allowRealClose = false;
        private bool hasShownTrayTip = false;
        private readonly NotifyIcon trayIcon;

        public MainForm(string url, Icon appIcon, NotifyIcon tray)
        {
            this.targetUrl = url;
            this.trayIcon = tray;
            this.Text = "QQ 智能消息筛选与 AI 深度日报助手 (与官方 QQ 同号共存独立软件)";
            this.Size = new Size(1400, 890);
            this.MinimumSize = new Size(1020, 660);
            this.StartPosition = FormStartPosition.CenterScreen;
            this.BackColor = Color.FromArgb(14, 16, 21);
            this.ForeColor = Color.FromArgb(240, 243, 248);
            if (appIcon != null)
            {
                this.Icon = appIcon;
            }

            try
            {
                int useDark = 1;
                DwmSetWindowAttribute(this.Handle, 20, ref useDark, sizeof(int));
            }
            catch { }

            loadingLabel = new Label
            {
                Text = "✦ 正在加载 QQ 智能消息筛选与 AI 深度日报工作台...",
                Dock = DockStyle.Fill,
                TextAlign = ContentAlignment.MiddleCenter,
                Font = new Font("Microsoft YaHei UI", 12F, FontStyle.Regular),
                ForeColor = Color.FromArgb(160, 170, 190),
                BackColor = Color.FromArgb(14, 16, 21)
            };
            this.Controls.Add(loadingLabel);

            this.Load += async (s, e) =>
            {
                try
                {
                    Program.LogBoot("MainForm Load: initializing WebView2...");
                    webView = new WebView2
                    {
                        Dock = DockStyle.Fill,
                        DefaultBackgroundColor = Color.FromArgb(14, 16, 21),
                        Visible = false
                    };
                    this.Controls.Add(webView);
                    webView.BringToFront();

                    string userDataDir = Path.Combine(Program.ProjectDir, "data", "webview2_userdata");
                    Directory.CreateDirectory(userDataDir);
                    var env = await CoreWebView2Environment.CreateAsync(null, userDataDir);
                    await webView.EnsureCoreWebView2Async(env);

                    webView.CoreWebView2.Settings.AreDefaultContextMenusEnabled = true;
                    webView.CoreWebView2.Settings.AreDevToolsEnabled = true;
                    webView.CoreWebView2.Settings.IsStatusBarEnabled = false;
                    webView.CoreWebView2.NavigationCompleted += (sender, args) =>
                    {
                        if (!args.IsSuccess)
                        {
                            Program.LogBoot("WebView2 navigation not ready yet, retrying in 1.2s...");
                            System.Windows.Forms.Timer retryTimer = new System.Windows.Forms.Timer { Interval = 1200 };
                            retryTimer.Tick += (ts, te) =>
                            {
                                retryTimer.Stop();
                                retryTimer.Dispose();
                                try { if (webView != null && webView.CoreWebView2 != null) webView.CoreWebView2.Navigate(this.targetUrl); } catch { }
                            };
                            retryTimer.Start();
                            return;
                        }
                        if (webView != null && !webView.Visible)
                        {
                            webView.Visible = true;
                            loadingLabel.Visible = false;
                        }
                    };
                    webView.CoreWebView2.Navigate(this.targetUrl);
                    Program.LogBoot("WebView2 navigated to " + this.targetUrl);
                }
                catch (Exception ex)
                {
                    Program.LogBoot("WebView2 init error: " + ex.ToString());
                    loadingLabel.Text = "工作台视图初始化异常: " + ex.Message;
                }
            };
        }

        public void ReloadDashboard()
        {
            try
            {
                if (webView != null && webView.CoreWebView2 != null)
                {
                    webView.CoreWebView2.Reload();
                }
            }
            catch { }
        }

        public void ShowAndActivate()
        {
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(ShowAndActivate));
                return;
            }
            if (!this.Visible)
            {
                this.Show();
            }
            if (this.WindowState == FormWindowState.Minimized)
            {
                this.WindowState = FormWindowState.Normal;
            }
            this.Activate();
            this.BringToFront();
        }

        public void ForceClose()
        {
            allowRealClose = true;
            if (this.InvokeRequired)
            {
                this.BeginInvoke(new Action(this.Close));
            }
            else
            {
                this.Close();
            }
        }

        protected override void OnFormClosing(FormClosingEventArgs e)
        {
            if (!allowRealClose && e.CloseReason == CloseReason.UserClosing)
            {
                e.Cancel = true;
                this.Hide();
                if (!hasShownTrayTip && trayIcon != null)
                {
                    hasShownTrayTip = true;
                    trayIcon.ShowBalloonTip(
                        2500,
                        "QQ 智能日报助手仍在后台为您守护",
                        "已最小化到右下角系统托盘，与官方 QQ 保持共存同步。双击托盘图标可随时呼出窗口。",
                        ToolTipIcon.Info
                    );
                }
                return;
            }
            base.OnFormClosing(e);
        }
    }

    static class Program
    {
        [DllImport("user32.dll")]
        private static extern bool SetProcessDPIAware();

        [DllImport("user32.dll")]
        private static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);

        [DllImport("user32.dll")]
        private static extern bool SetForegroundWindow(IntPtr hWnd);

        private const int SW_RESTORE = 9;

        public static readonly string ProjectDir = AppDomain.CurrentDomain.BaseDirectory.TrimEnd('\\', '/');
        private static readonly string DashboardUrl = "http://127.0.0.1:3210";
        private static readonly string ActionFilePath = Path.Combine(ProjectDir, "data", "desktop_action.json");
        private static readonly string BootLogPath = Path.Combine(ProjectDir, "data", "launcher_boot.log");
        private static readonly string QqSettingFilePath = @"C:\Program Files\Tencent\QQNT\versions\setting.json";
        private static readonly string QqExePath = @"C:\Program Files\Tencent\QQNT\QQ.exe";
        private static readonly string NapCatFrameworkDir = @"D:\NapCat\NapCat.Framework";
        private static readonly string NapCatMainExe = @"D:\NapCat\NapCat.Framework\napimain.exe";
        private static readonly string NapCatLoaderDll = @"D:\NapCat\NapCat.Framework\napiloader.dll";
        private static readonly string NapCatLoaderScript = @"D:/NapCat/NapCat.Framework/nativeLoader.cjs";

        private static Process backendProcess = null;
        private static Process aiHubProcess = null;
        private static NotifyIcon trayIcon = null;
        private static MainForm mainForm = null;
        private static System.Windows.Forms.Timer actionTimer = null;
        private static bool isExecutingAction = false;

        public static void LogBoot(string msg)
        {
            try
            {
                Directory.CreateDirectory(Path.Combine(ProjectDir, "data"));
                File.AppendAllText(BootLogPath, "[" + DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss") + "] " + msg + Environment.NewLine, Encoding.UTF8);
            }
            catch { }
        }

        [STAThread]
        static void Main()
        {
            try
            {
                try { SetProcessDPIAware(); } catch { }
                Application.EnableVisualStyles();
                Application.SetCompatibleTextRenderingDefault(false);

                LogBoot("Main started in ProjectDir: " + ProjectDir);

                bool createdNew;
                using (Mutex mutex = new Mutex(true, "QQAiDigestStandaloneAppMutex_v2", out createdNew))
                {
                    if (!createdNew)
                    {
                        LogBoot("Secondary instance detected, signaling primary instance to show window.");
                        try
                        {
                            Directory.CreateDirectory(Path.Combine(ProjectDir, "data"));
                            File.WriteAllText(ActionFilePath, "{\"action\":\"show-main-window\"}", Encoding.UTF8);
                        }
                        catch { }
                        return;
                    }

                    try { if (File.Exists(ActionFilePath)) File.Delete(ActionFilePath); } catch { }

                    // 1. 零黑框静默启动 AI 代理 (8788) 与本地日报后端 (3210)
                    EnsureAiHubRunning();
                    EnsureNativeBackendRunning();

                    // 2. 自动检测并启动【同号有头共存版官方 QQ】(若 3001 端口未就绪则自动拉起共存版官方 QQ)
                    ThreadPool.QueueUserWorkItem(_ => EnsureCoexistQqRunning(false));

                    // 3. 加载应用图标
                    Icon appIcon = SystemIcons.Application;
                    string favIco = @"D:\NapCat\NapCat.Framework\static\favicon.ico";
                    if (!File.Exists(favIco)) favIco = @"D:\NapCat\NapCat.Shell\static\favicon.ico";
                    if (File.Exists(favIco))
                    {
                        try { appIcon = new Icon(favIco); } catch { }
                    }

                    // 4. 创建系统托盘图标与右键菜单
                    ContextMenu trayMenu = new ContextMenu();
                    trayMenu.MenuItems.Add("🖥️ 显示 QQ 智能日报助手主窗口", (s, e) =>
                    {
                        if (mainForm != null) mainForm.ShowAndActivate();
                    });
                    trayMenu.MenuItems.Add("💬 启动 / 呼出共存版官方桌面 QQ", (s, e) =>
                    {
                        ThreadPool.QueueUserWorkItem(_ => LaunchOrFocusCoexistQQ());
                    });
                    trayMenu.MenuItems.Add("🔄 刷新日报视图", (s, e) =>
                    {
                        if (mainForm != null) mainForm.ReloadDashboard();
                    });
                    trayMenu.MenuItems.Add("-");
                    trayMenu.MenuItems.Add("❌ 彻底退出日报助手 (保留官方 QQ)", (s, e) => ExitAll());

                    trayIcon = new NotifyIcon
                    {
                        Text = "QQ 智能消息筛选与 AI 深度日报助手",
                        Icon = appIcon,
                        ContextMenu = trayMenu,
                        Visible = true
                    };
                    trayIcon.DoubleClick += (s, e) =>
                    {
                        if (mainForm != null) mainForm.ShowAndActivate();
                    };

                    // 5. 创建原生桌面主窗口 (内嵌 WebView2，无任何浏览器外壳或黑框)
                    mainForm = new MainForm(DashboardUrl, appIcon, trayIcon);

                    // 6. 监听桌面指令队列
                    actionTimer = new System.Windows.Forms.Timer();
                    actionTimer.Interval = 500;
                    actionTimer.Tick += OnActionTimerTick;
                    actionTimer.Start();

                    LogBoot("Entering Application.Run(mainForm)...");
                    Application.Run(mainForm);
                }
            }
            catch (Exception ex)
            {
                LogBoot("Fatal exception in Main: " + ex.ToString());
            }
        }

        private static void OnActionTimerTick(object sender, EventArgs e)
        {
            if (isExecutingAction) return;
            try
            {
                if (File.Exists(ActionFilePath))
                {
                    isExecutingAction = true;
                    string content = "";
                    try
                    {
                        content = File.ReadAllText(ActionFilePath, Encoding.UTF8);
                        File.Delete(ActionFilePath);
                    }
                    catch { }

                    if (content.Contains("show-main-window"))
                    {
                        if (backendProcess == null || backendProcess.HasExited)
                        {
                            StartBackendSilently();
                        }
                        if (mainForm != null) mainForm.ShowAndActivate();
                        isExecutingAction = false;
                        return;
                    }
                    else if (content.Contains("focus-coexist-qq"))
                    {
                        ThreadPool.QueueUserWorkItem(_ =>
                        {
                            try { FocusOfficialQqWindow(); }
                            finally { isExecutingAction = false; }
                        });
                        return;
                    }
                    else if (content.Contains("launch-coexist-qq") || content.Contains("launch-napcat") || content.Contains("switch-official-qq"))
                    {
                        ThreadPool.QueueUserWorkItem(_ =>
                        {
                            try { LaunchOrFocusCoexistQQ(); }
                            finally { isExecutingAction = false; }
                        });
                        return;
                    }
                    isExecutingAction = false;
                }
            }
            catch
            {
                isExecutingAction = false;
            }
        }

        private static void EnsureAiHubRunning()
        {
            if (IsPortOpen("127.0.0.1", 8788, 300)) return;
            try
            {
                string hubDir = Path.Combine(ProjectDir, "workbuddy2api-hub");
                string wbProxyPy = Path.Combine(hubDir, "wb_proxy.py");
                if (!File.Exists(wbProxyPy)) return;

                string pythonExe = @"D:\Miniconda\pythonw.exe";
                if (!File.Exists(pythonExe)) pythonExe = @"D:\Miniconda\python.exe";
                if (!File.Exists(pythonExe)) pythonExe = "python";

                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = pythonExe,
                    Arguments = "\"" + wbProxyPy + "\" --port 8788",
                    WorkingDirectory = hubDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                aiHubProcess = Process.Start(psi);
                LogBoot("Started AI Hub wb_proxy.py (8788) silently with " + pythonExe);
            }
            catch (Exception ex)
            {
                LogBoot("EnsureAiHubRunning error: " + ex.Message);
            }
        }

        private static void EnsureNativeBackendRunning()
        {
            bool portOpen = IsPortOpen("127.0.0.1", 3210, 400);
            if (portOpen)
            {
                try
                {
                    using (WebClient wc = new WebClient())
                    {
                        wc.Encoding = Encoding.UTF8;
                        string json = wc.DownloadString(DashboardUrl + "/api/status");
                        if (json.Contains("\"isSandbox\":true"))
                        {
                            Match m = Regex.Match(json, "\"serverPid\":(\\d+)");
                            if (m.Success)
                            {
                                KillProcessTreeByPid(m.Groups[1].Value);
                                Thread.Sleep(1200);
                                portOpen = false;
                            }
                        }
                    }
                }
                catch { }
            }

            if (!portOpen)
            {
                StartBackendSilently();
                for (int i = 0; i < 20; i++)
                {
                    if (IsPortOpen("127.0.0.1", 3210, 300))
                        break;
                    Thread.Sleep(400);
                }
            }
        }

        private static void StartBackendSilently()
        {
            try
            {
                string[] nodeCandidates = new string[]
                {
                    @"D:\360安全浏览器下载\node.exe",
                    @"C:\Program Files\nodejs\node.exe",
                    @"D:\deepseekharness\tools\node-v24.22.2-win-x64\node.exe",
                    "node.exe"
                };
                string nodeExe = "node.exe";
                foreach (string c in nodeCandidates)
                {
                    if (File.Exists(c))
                    {
                        nodeExe = c;
                        break;
                    }
                }

                string backendLog = Path.Combine(ProjectDir, "data", "backend.log");
                ProcessStartInfo psi = new ProcessStartInfo
                {
                    FileName = nodeExe,
                    Arguments = "--import ./node_modules/tsx/dist/preflight.cjs --import ./node_modules/tsx/dist/loader.mjs src/index.ts",
                    WorkingDirectory = ProjectDir,
                    UseShellExecute = false,
                    CreateNoWindow = true,
                    RedirectStandardInput = true,
                    RedirectStandardOutput = true,
                    RedirectStandardError = true,
                    StandardOutputEncoding = Encoding.UTF8,
                    StandardErrorEncoding = Encoding.UTF8,
                    WindowStyle = ProcessWindowStyle.Hidden
                };
                backendProcess = new Process { StartInfo = psi };
                backendProcess.OutputDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        try { File.AppendAllText(backendLog, e.Data + Environment.NewLine, Encoding.UTF8); } catch { }
                    }
                };
                backendProcess.ErrorDataReceived += (s, e) =>
                {
                    if (!string.IsNullOrEmpty(e.Data))
                    {
                        try { File.AppendAllText(backendLog, "[ERR] " + e.Data + Environment.NewLine, Encoding.UTF8); } catch { }
                    }
                };
                backendProcess.Start();
                backendProcess.BeginOutputReadLine();
                backendProcess.BeginErrorReadLine();
                LogBoot("Started backend (3210) silently with nodeExe: " + nodeExe + " (PID=" + backendProcess.Id + ")");
            }
            catch (Exception ex)
            {
                LogBoot("StartBackendSilently error: " + ex.ToString());
            }
        }

        private static void EnsureCoexistQqRunning(bool forceRestart)
        {
            try
            {
                if (!forceRestart && IsPortOpen("127.0.0.1", 3001, 400))
                {
                    LogBoot("Port 3001 already open, Coexistence Official QQ is already running.");
                    return;
                }

                LogBoot("Launching Coexistence Official QQ via napimain.exe...");
                RunSilentCommand("taskkill", "/F /T /IM NapCatWinBootMain.exe", 1500);
                RunSilentCommand("taskkill", "/F /T /IM napimain.exe", 1500);
                RunSilentCommand("taskkill", "/F /T /IM QQ.exe", 2000);
                ResetQqLauncherCounts();
                Thread.Sleep(1800);

                if (File.Exists(NapCatMainExe) && File.Exists(QqExePath))
                {
                    ProcessStartInfo psi = new ProcessStartInfo
                    {
                        FileName = NapCatMainExe,
                        Arguments = "\"" + QqExePath + "\" \"" + NapCatLoaderDll + "\" \"" + NapCatLoaderScript + "\"",
                        WorkingDirectory = NapCatFrameworkDir,
                        UseShellExecute = false,
                        CreateNoWindow = true
                    };
                    Process.Start(psi);
                    LogBoot("Coexistence Official QQ launched via napimain.exe (0 console windows).");
                }
            }
            catch (Exception ex)
            {
                LogBoot("EnsureCoexistQqRunning error: " + ex.ToString());
            }
        }

        private static void LaunchOrFocusCoexistQQ()
        {
            if (IsPortOpen("127.0.0.1", 3001, 400))
            {
                if (!FocusOfficialQqWindow())
                {
                    EnsureCoexistQqRunning(true);
                }
            }
            else
            {
                EnsureCoexistQqRunning(true);
            }
        }

        private static bool FocusOfficialQqWindow()
        {
            try
            {
                Process[] procs = Process.GetProcessesByName("QQ");
                foreach (Process p in procs)
                {
                    if (p.MainWindowHandle != IntPtr.Zero)
                    {
                        ShowWindow(p.MainWindowHandle, SW_RESTORE);
                        SetForegroundWindow(p.MainWindowHandle);
                        return true;
                    }
                }
            }
            catch { }
            return false;
        }

        private static void RunSilentCommand(string fileName, string args, int waitMs)
        {
            try
            {
                Process p = Process.Start(new ProcessStartInfo
                {
                    FileName = fileName,
                    Arguments = args,
                    CreateNoWindow = true,
                    UseShellExecute = false,
                    WindowStyle = ProcessWindowStyle.Hidden
                });
                if (p != null) p.WaitForExit(waitMs);
            }
            catch { }
        }

        private static void KillProcessTreeByPid(string pid)
        {
            RunSilentCommand("taskkill", "/F /T /PID " + pid, 2000);
        }

        private static bool IsPortOpen(string host, int port, int timeoutMs)
        {
            try
            {
                using (TcpClient client = new TcpClient())
                {
                    var result = client.BeginConnect(host, port, null, null);
                    bool success = result.AsyncWaitHandle.WaitOne(TimeSpan.FromMilliseconds(timeoutMs));
                    if (!success) return false;
                    client.EndConnect(result);
                    return true;
                }
            }
            catch
            {
                return false;
            }
        }

        private static void ResetQqLauncherCounts()
        {
            try
            {
                if (File.Exists(QqSettingFilePath))
                {
                    File.WriteAllText(QqSettingFilePath, "{\"launcherCounts\":0}", Encoding.UTF8);
                }
            }
            catch { }
        }

        private static void ExitAll()
        {
            try
            {
                if (actionTimer != null) actionTimer.Stop();
                if (trayIcon != null)
                {
                    trayIcon.Visible = false;
                    trayIcon.Dispose();
                }
                if (backendProcess != null && !backendProcess.HasExited)
                {
                    KillProcessTreeByPid(backendProcess.Id.ToString());
                }
                if (mainForm != null)
                {
                    mainForm.ForceClose();
                }
            }
            catch { }
            Environment.Exit(0);
        }
    }
}
