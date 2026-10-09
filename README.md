# DeepSeek Harness 自定义模型推理强度插件

为 DeepSeek Harness 的自定义模型提供按模型配置推理强度的插件。插件将配置写入 Harness 原生支持的 reasoningEfforts 字段，并基于当前设置版本提交，避免覆盖并发修改。

## 使用方法

1. 打开“设置 → 模型”，展开已配置的自定义提供商。
2. 展开“模型推理强度 · 按模型设置”。
3. 勾选接口支持的推理档位，并填写接口实际接受的值。档位名称显示在 Harness 模型选择器中，接口实际值会发送给提供商。
4. “关闭”的接口值留空时，请求不会发送推理强度字段。模型不支持推理控制时，勾选“不支持推理强度”。
5. 保存设置，然后在聊天模型选择器中选择模型并调整推理强度。

可配置档位：minimal、low、medium、high、xhigh、max。可按网关要求映射接口实际值，例如将 max 映射为 ultra。

## 安装

下载 dist 目录中的 dsh-custom-model-reasoning-0.1.3.tgz，在 Harness“插件 → 添加插件”中选择该文件，或运行以下命令：

    dsh plugin --profile desktop add "<安装包的绝对路径>"

安装后重启 DeepSeek Harness。卸载时可在“插件”页面移除本插件。

插件会编辑自定义 models 条目和已有的 modelOverrides。提供商协议必须支持 Harness 发送的推理参数；接口实际值请以网关文档为准。

## 许可证

MIT，详见 [LICENSE](LICENSE)。
