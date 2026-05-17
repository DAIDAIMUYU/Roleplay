# 08_上下文引擎_ContextBuilder设计

## 核心目标

用户要知道：这次 AI 到底读了什么、没读什么、为什么回复变成这样、成本大概来自哪里。

## 上下文来源

必入层：

- 系统规则
- 当前角色卡核心设定
- 当前用户 persona
- 最近 N 条消息
- 当前用户输入

条件层：

- 当前场景
- 剧情摘要
- pinned memory
- 世界书命中
- 检索记忆
- 群聊参与角色设定
- Author's Note / 旁白规则

## 上下文构建顺序

```text
输入消息
→ 读取 session / branch
→ 读取角色与参与者
→ 读取 summary / pinned memory
→ 匹配 worldbook
→ 检索 memory
→ 预算器裁剪
→ 生成 context preview
→ Provider Gateway
→ 写入 context_runs
```

## 预算建议

默认预算分配：

- 输出保留：10%-20%
- 最近消息：35%-45%
- 角色与系统：20%-25%
- Summary / Pinned：10%-15%
- Worldbook / Memory：10%-20%

## 裁剪原则

1. 保留系统规则与当前输入。
2. 保留角色核心设定。
3. 保留最近消息。
4. 优先裁剪低优先级世界书。
5. 再裁剪低 salience memory。
6. 最后提示用户“上下文超限”。

## Context Preview 面板

必须展示：

- 本轮 system rules tokens
- character tokens
- recent messages tokens
- summary tokens
- worldbook entries
- memories
- dropped items
- estimated input tokens
- reserved output tokens
- estimated cost
- provider/model

## context_runs

每次请求可选保存快照：

- provider/model
- input/output tokens
- context components
- dropped components
- cache hit tokens
- latency
- cost
- debug enabled

默认不保存完整 prompt 原文；只有用户打开 debug 时才保存必要快照。
