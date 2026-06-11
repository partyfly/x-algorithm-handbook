# X Algorithm Handbook · X 算法规则手册

**EN** | Rules and playbooks distilled from X (Twitter)'s open-source recommendation algorithm — the 2025-09 updated code, not the stale 2023 analysis floating around. Every number cites a source file inside [`twitter/the-algorithm`](https://github.com/twitter/the-algorithm) (commit `c54bec0`, 2025-09-03) or [`twitter/the-algorithm-ml`](https://github.com/twitter/the-algorithm-ml), so you can verify everything yourself.

**中文** | 基于 X(Twitter)官方开源推荐算法源码(2025-09 更新版,而非网上流传的 2023 旧版分析)整理的规则与行动指南。每个数字都标注了源码文件出处,可自行验证。

## Read it / 在线阅读

- 🇬🇧 English: [`en/index.html`](en/index.html)
- 🇨🇳 中文: [`zh/index.html`](zh/index.html)

Open `index.html` for automatic language detection, or enable GitHub Pages on this repo to host it.

## What's inside / 内容

| Section | 章节 |
|---|---|
| Scoring: the points table (+75 author-engaged reply … −369 report) | 评分规则:权重表 |
| Boosts & penalties (×0.75 out-of-network, ×0.2 feedback fatigue, …) | 加成与惩罚系数 |
| Traffic sources & the four doors that ignore follower count | 流量入口与四条不看粉丝数的通道 |
| Account trust: TweepCred thresholds (500 / 2500 / ratio 0.6 / ÷50) | 账号信誉:TweepCred 阈值 |
| Limits & safety labels (NotGraduated, EngagementSpammer, …) | 限流与安全标签 |
| The seven clocks (30 min → 140 days) | 算法的七个时钟 |
| Playbooks: new account / 0-follower old account / dormant revival / niche pivot / per-post checklist | 行动指南:新号 / 0 粉老号 / 沉睡老号 / 换赛道 / 每帖清单 |
| FAQ + full source-file index | FAQ + 源码文件索引 |

## Method / 方法

Cloned both official repos, analyzed the ranking pipeline / candidate retrieval / trust & visibility layers with Claude Fable 5 agents in parallel, then hand-verified every published constant against the source files. 用 Claude Fable 5 的多 agent 并行分析排序管线、召回与信誉/可见性层,所有发布的常数均经人工对照源码复核。

## Disclaimer / 免责声明

The open-source code may differ from production; the 2025 code sets model weights remotely (defaults are 0 in code) — quoted weights are from X's last public table (2023-04), whose scale the official README still references. Treat numbers as scale hints, not exact values. 开源代码与生产环境可能存在差异,所有数字请当作量级参考。

## License

Content: CC BY 4.0. Quoted code identifiers belong to their respective owners (AGPL-3.0 for the upstream repos).
