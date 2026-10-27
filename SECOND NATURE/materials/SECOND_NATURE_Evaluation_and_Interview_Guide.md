# SECOND NATURE 评估与访谈执行指南

编制日期：2026-10-27  
适用项目：SECOND NATURE — One Day, Less Waste  
依据：[final project requirement.docx](https://chatgpt.com/library?file_id=libfile_d0043124d078819181ff5573c0fd81fc&account_id=personal)，全文 8 页。

这份指南用于招募、实施和分析一次小规模原型评估。推荐采用“游戏内 16 道量化评分＋过程观察＋游戏后半结构化访谈”。以下是执行计划和空白记录模板，不是已经完成的研究，也不是最终提交报告。

## 1 作业要求逐项核对

原文件有重复段落、断行和粘贴造成的编号错位。下表按要求合并重复项，并保留所有实质性限制。正文出现的“3 名”与后文“3 至 5 名”结合理解为招募 3–5 名，至少 3 名。文件未给出具体截止日期，需查课程发布信息，不能自行推测。

| 要求 | SECOND NATURE 的落实方式或待办 | 原文位置 |
|---|---|---|
| 设计并评估回应真实问题的界面 | 主题是学生日常减废；不仅展示游戏，还需真实实施评估 | 第 4 页 |
| 非标准交互 | 摄像头识别手部，指向、捏合、松开完成操作；行政登记在任务前输入 | 第 4 页 |
| 具体研究问题，说明互动领域、问题和理由 | 使用第 2 节的问题并解释学生生活场景 | 第 4 页 |
| 可测试的原型及评估计划 | 当前本地原型；计划覆盖第 3 节九项内容 | 第 4、8 页 |
| 3–5 位参与者 | 必须是当前 COMP3900/6390 学生；逐人确认 | 第 4、6 页 |
| 按模板列出参与者 | 在 project-documentation.md 中列出“- u1234567 Firstname Lastname”；不是只放在导出 PDF 中 | 第 1、6 页 |
| 数据类型可以自由选择 | 可选定性、定量或两者；本项目选择两者，不把 A2 的要求套到 Final Project | 第 5 页 |
| 研究问题、计划与结论 | 解释设计理由、数据收集策略、分析框架、HCI 学术依据及实际整体结论 | 第 4 页 |
| 原型设计与功能 | 提供可视化文档、功能与测试演示，解释如何满足使用语境中的用户需要 | 第 4 页 |
| 研究数据、分析与发现 | 展示实际数据摘录、图表、表格等，将发现回答到研究问题 | 第 5 页 |
| COMP6390 立场性陈述 | 批判反思自己的经历、背景、设计和研究影响；COMP3900 不完成该部分 | 第 5 页 |
| 同标题的书面呈现 | 沿用课程模板提供的章节标题；可为演讲文字稿或稍有不同 | 第 5、6 页 |
| 正文文件 | project-documentation.md，符合 Markdown 标准 | 第 1、6 页 |
| 正文字数 | 1800 字词目标，最多加 10% 即 1980；不要把本执行指南直接当作受限正文 | 第 6 页 |
| 至少 5 个外部来源 | 编号 ACM 参考文献列表，正文用 [1] 等编号引用，每条末尾有可访问 DOI 或 URL | 第 1、6 页 |
| 原始资料 | 调查／问卷逐条回答带时间戳，或录音、照片笔记、逐字稿等实际采集资料 | 第 1、6 页 |
| 保存位置 | 原始资料、分析脚本及相关材料进入课程模板分叉仓库的 materials/ 目录 | 第 1、6 页 |
| 原始资料不能被汇总代替 | 不能只交均分、统计表、主题摘要或游戏报告中的图表 | 第 1、6 页 |
| 演示视频是主要评分文件 | 重点讲研究问题、原型、方法、证据、发现与反思 | 第 1、5 页 |
| 视频文件与位置 | 仓库顶层 project-presentation.mp4；前文出现的重复 .mp4 是粘贴歧义，以后文一致的名称为准 | 第 1、6 页 |
| 视频格式 | MP4，H.264 或 H.265 编码；分辨率不超过 1920×1080 | 第 1、6 页 |
| 视频时长 | 目标 300 秒，硬上限 330 秒 | 第 1、6 页 |
| 口述与出镜 | 使用你本人的清晰语音，展示时面部清晰、可识别 | 第 7 页 |
| 幻灯片数量 | 至少 5 张、不超过 10 张 | 第 7 页 |
| 不必单独设置的幻灯片 | 标题、个人介绍、目录、参考资料页均非必需 | 第 7 页 |
| 文件大小 | 视频和 materials 中的每个相关录音／大文件均低于 100MB；不使用 Git LFS | 第 1、7 页 |
| 检查时机 | git add 之前检查大小；后续提交小文件不会删除历史中的大版本 | 第 1、7 页 |
| 提交位置与时限 | 截止前推送到课程 comp3900-2026-A3-final-project 模板的分叉仓库 | 第 6 页 |
| PowerPoint 导出 | 可用内置录制并导出 Full HD 1080p，不选 4K；ANU 学生可用 Microsoft 365 | 第 2、7 页 |
| 超大视频处理 | 只有达到 100MB 时才需再次压缩；H.264 2000 kbps、AAC 128 kbps，330 秒约 88MB 是估计值 | 第 2、3、7 页 |
| 压缩工具与复查 | HandBrake Fast 1080p30、平均码率 2000、多次编码；或下方 ffmpeg；完成后重查大小和音视频 | 第 2、3 页 |
| Markdown 帮助 | 原文提供 https://www.markdownguide.org | 第 3 页 |

压缩示例沿用要求文件，不代表已经处理了演示视频：

```powershell
ffmpeg -i exported-video.mp4 -c:v libx264 -preset slow -b:v 2000k -maxrate 2500k -bufsize 5000k -pix_fmt yuv420p -c:a aac -b:a 128k -movflags +faststart project-presentation.mp4
```

## 2 研究问题与设计理由

建议主问题：

**How do current COMP3900/6390 students interpret waste-prevention choices in SECOND NATURE, and what aspects of its gesture interface support or hinder their experience?**

中文：当前 COMP3900/6390 学生如何理解 SECOND NATURE 中的减废选择，哪些手势界面设计支持或阻碍其体验？

子问题与证据对应：

| 子问题 | 证据 | 可以得出的结论 |
|---|---|---|
| 学生如何理解减少获取、重复使用、剩余食物与回收？ | 减废评分 Q1–Q8、访谈 I2–I5、实际场景选择 | 感知理解、具体解释、当前行为意向 |
| 手势选择和反馈有哪些困难？ | 体验评分 Q9–Q16、观察、访谈 I6–I9 | 易用性、疲劳、反馈和连贯性的具体问题 |
| 这些情境能否用于学生日常生活？ | 相关性评分、访谈 I4、I5、I10 | 哪些设计有实际意义，受到什么设施和资源限制 |
| 下一轮应优先改什么？ | 访谈 I11–I12与前述证据 | 有依据的改进方向和需要再次验证的问题 |

项目围绕一次性用品、食物份量、重复使用和延长物品使用展开，可联系 SDG 12 的食物浪费、减少废物以及可持续生活意识目标 [1]。把日常选择串联起来，能用于讨论“早先准备如何改变后续选择”；这是本项目的设计假设，仍须通过评估判断。

## 3 评估计划的九项内容

### 3.1 评估目标

检视参与者对减废后果的理解、手势操作体验，以及原型与实际学生生活的适配程度。找出下一轮设计应修改的具体问题。本研究不预设游戏有效，也不以得高分为目标。

### 3.2 参与者

招募 3–5 名当前 COMP3900/6390 学生。记录姓名、学号、课程和参与者编号 P01–P05。研究结果图表及引语用参与者编号，课程正文的 Participants 栏按要求列出学号和姓名。同一人重玩不算另一名参与者；同一人换编号也不能重复计入样本。

### 3.3 背景设定

使用同一电脑、摄像头和浏览器；记录屏幕尺寸、浏览器版本、日期、时区、光照、座位／站位及摄像头距离。允许休息和姿势调整，记录其影响。当前故事含 17 个选择场景，包括新增出行场景；正式研究前固定应用版本，避免在参与者之间悄悄更换界面或题目。

### 3.4 收集哪些数据

- 登记与同意：参与者身份、课程、研究编号、同意时间与告知版本。
- 系统原始日志：会话 ID、场景、实际可选项、提交选择、事件时间、暂停、恢复、帮助事件和版本。
- 量化回答：16 道 1–5 分回答，保留原题、各分值含义、回答时间及缺失值。
- 观察：研究者亲眼看到的困难、当时场景、参与者原话、协助以及上下文。
- 定性材料：访谈原始录音及核对后的逐字稿，或开放式问卷原始文字，或当场详细访谈笔记。
- 可选知识题：现有 A/B 各 3 题；仅在事先决定启用时一致使用，记录次序。

### 3.5 方法

采用小样本形成性评估：一次实际操作，随后填写评分，再做约 10–15 分钟半结构化访谈。时长只是安排估计，不是参与者必须在限时内完成的要求。游戏内没有答题倒计时。

观察期间不持续解释“正确答案”。可以让参与者自然表达想法；若采用持续出声思考，应对所有人说明一致，并在分析中说明它可能改变思考和操作时间。默认采用任务后回顾访谈，减少对正常游戏过程的打断。

### 3.6 伦理与同意

正式开始前说明课程用途、姓名学号将进入课程提交材料、谁能访问数据、实际存储位置、预计保留／删除日期、退出联系办法和撤回截止时间。研究者必须先确定这些具体安排，再取得同意。

参与者可拒绝、休息或退出。游戏同意不自动代表同意录音、拍照或公开视频；分别询问并记录。拒绝录音时可在同意后做笔记，明确标为访谈笔记，不声称逐字稿。只记录真实说过的话。

本地浏览器会保存研究记录，导出的 PDF 和原始文件含姓名、学号。不要将这些文件提交到公开的游戏源码仓库；应放到按课程要求配置访问权限的作业仓库。演示视频以你本人出镜为准，参与者肖像并非本文件列出的要求。

### 3.7 采集、记录与存储

在首页选择主按钮 Start a new day，首先进入姓名与学号登记页，由研究者用键盘输入英文或拼音全名、u 加 7 位数字的学号。参与者核对并用手势确认当前课程，阅读说明后用新的捏合动作同意。登记是任务前准备，正式游戏与评分仍采用手势。Free play (no participant details) 是不登记身份的独立试玩入口，不用于正式参与者研究。

系统记录 UTC 的 ISO 时间及设备时区；PDF 同时显示会话开始的本地日期时间。研究前检查设备日期和时区。故事结束时间、16 题全部完成时间、导出时间分别记录，不能互相替代。只有部分题目完成时，评估完成时间留空；原有历史记录缺失的身份不补造。

导出的单个 PDF 内含原始附件。使用项目的提取脚本，把附件保存到课程 materials/ 下，另行保存真实访谈材料。PDF 的汇总页面不能替代这些原始文件。

### 3.8 分析方法

定量：逐题报告每位参与者的回答、有效样本数、缺失数、1–5 分频数、中位数和范围。小样本图表显示人数和分母，避免只有百分比。不要把 16 道自编题合成 SUS、统一总分或“环保能力分”。

定性：熟悉完整材料，初步编码，形成候选主题，回看原始资料修订，界定主题，再用证据写发现 [2]。保留“原文行号／时间→编码→主题→设计含义”的过程。允许不支持预期的回答出现，不能预填“大家都喜欢”等结果。

整合：用某题的分布寻找要进一步解释的现象，再回看同一个人的访谈和观察。若数据矛盾，报告并解释可能原因，不强行统一。录音拒绝、未完成和缺失也应报告。

### 3.9 评估产出

最终需要真实原始数据、可重复运行的分析脚本、少量清晰图表、带出处的实际引语、回答研究问题的发现、设计改进建议及限制。COMP6390 还需立场性陈述。自动生成的游戏个人报告只是证据的一部分。

## 4 每位参与者的执行流程

1. 研究前确定存储、访问、删除和撤回安排，固定版本，做一次不计入正式样本的试运行。
2. 确认当前课程资格，登记身份，说明用途及权利，取得同意；另问录音／拍照许可。
3. 记录环境和开始时间，进行指向、捏合、松开的练习。
4. 如果计划启用知识题，先完成前测；不要给正确答案提示。
5. 完成故事；研究者记录观察，不指导环保选择。必要协助要写下内容和时间。
6. 如果启用知识题，完成后测，然后完成前 15 道评分。提醒没有理想分数，可休息或结束。
7. 系统随后打开四个结果页面；按 Next page 浏览，在第四页选择 Answer final rating，回答第 16 题结果清晰度，再导出 PDF。系统保存结果页查看和确认时间。未完成评分时仍可导出，但按钮会明确提示 ratings incomplete；不要为了补齐数据替参与者回答。
8. 进行半结构化访谈或开放式问卷；保存实际回答，关联同一参与者编号、会话 ID 和时间。
9. 提醒退出／撤回办法；核对文件是否完整并备份。重玩单独标记，不替换第一次原始记录。

## 5 游戏内量化题目

这 16 题已经在游戏结束流程中。完整英文措辞与五级标签见随导出附带的 rating-questionnaire.json；评分版本为 waste-ui-2，应用版本为 1.3.1。第 16 题放在结果页之后，其余题在结果页之前，避免结果展示改变即时减废自评及操作体验回答。结果页的查看记录不代表参与者已阅读每条细节。旧版答案保留原始含义，不能直接与新版结果清晰度回答混为一组。

| 题号 | 主题 | 原题 | 1 分至 5 分的标签 |
|---|---|---|---|
| Q1 | 减废 | How clear are you about which everyday choices create single-use waste? | 1 Not at all clear / 2 Slightly clear / 3 Moderately clear / 4 Very clear / 5 Extremely clear |
| Q2 | 减废 | How clear are you about ways to avoid wasting edible food? | 1 Not at all clear / 2 Slightly clear / 3 Moderately clear / 4 Very clear / 5 Extremely clear |
| Q3 | 减废 | How clear is the difference between preventing waste and recycling it? | 1 Not at all clear / 2 Slightly clear / 3 Moderately clear / 4 Very clear / 5 Extremely clear |
| Q4 | 减废 | How clear was the link between your choices and the waste recorded in the story? | 1 Not clear / 2 Slightly clear / 3 Moderately clear / 4 Clear / 5 Very clear |
| Q5 | 减废 | How confident are you in choosing a way to reduce waste in your daily routine? | 1 Not confident / 2 Slightly confident / 3 Moderately confident / 4 Very confident / 5 Extremely confident |
| Q6 | 减废 | How relevant were the waste-related situations to your student life? | 1 Not relevant / 2 Slightly relevant / 3 Moderately relevant / 4 Very relevant / 5 Extremely relevant |
| Q7 | 减废 | How likely are you to bring a reusable item when you next need one? | 1 Very unlikely / 2 Unlikely / 3 Neither likely nor unlikely / 4 Likely / 5 Very likely |
| Q8 | 减废 | How likely are you to plan your next meal portion to avoid leftovers? | 1 Very unlikely / 2 Unlikely / 3 Neither likely nor unlikely / 4 Likely / 5 Very likely |
| Q9 | 界面体验 | How easy was it to choose with your hand? | 1 Very difficult / 2 Difficult / 3 Neither easy nor difficult / 4 Easy / 5 Very easy |
| Q10 | 界面体验 | How responsive did the cursor feel when you moved your hand? | 1 Very unresponsive / 2 Unresponsive / 3 Neither responsive nor unresponsive / 4 Responsive / 5 Very responsive |
| Q11 | 界面体验 | How often did the game select the option you intended? | 1 Never / 2 Rarely / 3 Sometimes / 4 Often / 5 Always |
| Q12 | 界面体验 | How clear was the feedback that your pinch had selected an option? | 1 Not clear / 2 Slightly clear / 3 Moderately clear / 4 Clear / 5 Very clear |
| Q13 | 界面体验 | How tired does your arm feel? | 1 Not tired / 2 A little tired / 3 Moderately tired / 4 Tired / 5 Very tired |
| Q14 | 界面体验 | How connected did the story feel? | 1 Not connected / 2 Slightly connected / 3 Moderately connected / 4 Connected / 5 Very connected |
| Q15 | 界面体验 | How engaging was the experience of playing the story? | 1 Not engaging / 2 Slightly engaging / 3 Moderately engaging / 4 Very engaging / 5 Extremely engaging |
| Q16 | 界面体验 | How clear were the end-of-day outcomes? | 1 Not clear / 2 Slightly clear / 3 Moderately clear / 4 Clear / 5 Very clear |

每题是独立的有序评分。疲劳题分数越高表示越疲劳，其余题按各自问题解释。感知理解、信心、意向都不是实际长期行为改变；选择准确性的自评分也不是测得的误触率。

没有前测时，不能称这些结束评分为“提高了多少”。可选知识 A/B 题不是已验证的等价量表，即使前后得分不同也不能据此证明因果学习效果。

## 6 可直接使用的访谈问题

以下英文供向参与者提问，中文用于帮助研究者掌握意图。先问开放问题，再按回答选 1–2 个追问；不必机械读完每个追问。I1–I8、I11 是核心，I9、I10、I12 视时长补充。

开场：

“Thank you for trying SECOND NATURE. I am evaluating the prototype, not testing you. Honest criticism is useful. You can skip a question, take a break or stop. I will ask about specific moments in the game and how they relate to your daily life.”

如计划录音，先落实第 3.6 节具体告知，再问：“Do you agree to this interview being audio-recorded for the course evaluation?” 记录真实答复，不把此句当作已获同意。

### I1 整体理解

**In your own words, what was this game asking you to think about?**

中文：用自己的话描述游戏关注的事情。  
中性追问：“What gave you that impression?” “Which part stands out most?”  
用途：先了解参与者自己的理解，避免一开始提示预期主题。

### I2 具体选择及理由

**Tell me about one choice you made and what you expected to happen afterwards.**

中文：回忆一次选择及其预期后果。  
追问：“What happened instead, if anything?” “What led you to choose that option?”  
用途：将理解与实际场景、选择日志关联。

### I3 减废与回收的区别

**How would you explain the difference between using fewer disposable items, keeping an item for reuse, and sending it for recycling?**

中文：解释减少一次性用品、继续使用、回收之间的区别。  
追问：“Can you use an example from the story?” “Was any part unclear?”  
用途：获取实际解释，不只依赖“我觉得我懂了”的评分。先记录答案，不当场纠正。

### I4 食物与现实限制

**Thinking about the food scenes, which choices would or would not fit your own routine, and why?**

中文：食物情境与个人生活的适配。  
追问：“What would affect whether you could do that?” 如需进一步提示，可询问时间、价格、储存条件，但标注这是研究者提示。  
用途：理解可行性，避免将现实限制误解为环保意识不足。

### I5 未来意向及原有习惯

**After playing, is there anything you would consider doing differently, or would you keep your routine the same?**

中文：可能调整什么，也允许“保持不变”。  
追问：“Is that new for you or something you already do?” “What might make it easier or harder?”  
用途：区分已有习惯、当前意向和实际改变。

### I6 手势学习与预期

**How did you work out how to point, pinch and release?**

中文：如何理解并学会操作。  
追问：“What did you expect the cursor or circle to do?” “Was there a moment when you needed help?”  
用途：评估说明、反馈与操作映射。

### I7 选中与意图不一致

**Was there any moment when the game responded differently from what you intended? If so, please describe it.**

中文：是否有系统响应与意图不一致的时刻，也允许回答没有。  
追问：“Which scene was that?” “What were you trying to select?” “What did you do next?”  
用途：不能仅凭 tracking_lost 日志判定误触；结合描述与观察确认。

### I8 疲劳与身体体验

**How did your hand or arm feel during the session?**

中文：了解身体负担。  
追问：“Did that change as you played?” “Did you change your posture or take a rest?”  
用途：解释疲劳评分及操作条件，不预设一定疲劳。

### I9 阅读与转场

**How did the dialogue, images and transitions affect your experience?**

中文：画面、文字和黑屏转场的影响。  
追问：“Were there times you wanted to move on sooner or needed more time?” “How did you know what to do next?”  
用途：评估节奏、可读性、继续按钮和故事连贯性。

### I10 结果页的解释

**What did you understand from the end-of-day results?**

中文：结果页传达了什么。  
追问：“Which parts were clear or unclear?” “What do you think those numbers represent?”  
用途：检查是否把模拟数量误认为实际垃圾重量、减排或真实生活表现。

### I11 评分背后的原因与优先改进

**Choose one rating you gave that you would like to explain. What led to that score?**

随后问：**If you could change one part of the prototype, what would you change first, and why?**

中文：让参与者自主解释评分，并选择最优先改进点。  
追问：“Can you describe the moment behind that?” “What difference would your change make?”  
用途：把数字转为有证据的设计决策，不只围绕低分追问。

### I12 补充与遗漏

**Was anything missing or unrealistic for your student life? Is there anything else you would like to add?**

中文：识别研究者没想到的情境及其他意见。  
用途：给参与者保留提出新问题的空间。

结束：“Thank you. Your comments will help me identify what to change. The study contact and withdrawal arrangements are the ones explained before the session.”

## 7 如果采用开放式问卷而不是访谈

可将 I1、I2、I4、I5、I7、I8、I10、I11 放入文本问卷。记录参与者编号、会话 ID、填写时间、原始问题和未经改写的完整回答，允许跳过并保留空值。

问卷便于保存，但不能即时澄清“这很奇怪”究竟指哪一幕。访谈能追问具体经历，需转录或详细笔记。两者任选其一即可提供定性材料，不必重复采集相同问题以增加负担。

## 8 原始记录模板

### 8.1 访谈记录头

- Participant code：
- Session ID：
- Interviewer：
- Interview date and start time with time zone：
- Interview end time：
- Current app and model version：
- Consent for interview：
- Separate consent for audio：
- Method：audio transcript / contemporaneous notes / written questionnaire
- Audio filename if recorded：
- Transcript prepared on：
- Transcript checked against audio by：
- Language and any translation notes：
- Researcher assistance or unusual context：

### 8.2 逐字稿格式

| 行号 | 录音时间或记录时间 | 发言者 | 原始发言 | 场景或问题 |
|---|---|---|---|---|
| 留空待实际记录 |  |  |  |  |

逐字稿尽量保留实际措辞；听不清写“[inaudible]”，不要猜。翻译另列，保留原文。访谈笔记与整理后的概括要标明性质；未逐字记录的概括不能加引号冒充引语。

### 8.3 观察记录格式

| 时间与时区 | 参与者／会话 | 场景 | 直接观察 | 实际原话 | 研究者协助 | 解释或待核实问题 |
|---|---|---|---|---|---|---|
| 留空待实际记录 |  |  |  |  |  |  |

“手停在按钮上 5 秒”可以是观察；“他不知道怎么操作”属于解释，需要其他证据。研究者口头帮助不会自动变成系统帮助事件，应另记。

### 8.4 编码与发现记录

| 参与者 | 原始文件与行号／时间 | 原始片段 | 初步编码 | 候选主题 | 不支持该解释的证据 | 设计含义 |
|---|---|---|---|---|---|---|
| 留空待分析 |  |  |  |  |  |  |

不能预先填写参与者回答、统计结果或主题。少量参与者的主题不能声称覆盖所有学生或达到普遍代表性。

## 9 文件整理与可复现分析

课程仓库的 materials/ 建议按下表整理。这里的 P01 等是目录示例，不是已经招募了参与者。

| 位置 | 内容 |
|---|---|
| materials/P01/report.pdf | 原始单人导出 PDF |
| materials/P01/session.json | 提取的完整会话、事件、原始答案与场景快照 |
| materials/P01/ratings.csv | 逐题分值、全部标签、时间戳与身份信息 |
| materials/P01/export-metadata.json | 导出时间、登记信息及会话时间 |
| materials/P01/participant.csv | 参与者信息 |
| materials/P01/participant-list.txt | 可合并到最终 Participants 栏的格式化条目 |
| materials/P01/choices.csv、events.csv 等 | 原始行为记录 |
| materials/P01/interview-original.* | 实际录音、逐字稿或原始书面回答 |
| materials/P01/observation.csv | 真实观察记录 |
| materials/analysis/ | 分析脚本、运行说明、实际输出、编码与图表 |
| materials/protocol/ | 使用的计划、问卷版本、空白访谈提纲与告知说明 |

从游戏项目目录运行，输出目的地应指向实际课程仓库：

```powershell
python materials/extract_report.py "下载目录/报告.pdf" --output "课程仓库/materials/P01"
```

单人检查：

```powershell
python "课程仓库/materials/P01/analyze_story.py" "课程仓库/materials/P01/session.json"
```

多人分析前，将导出的 analyze_story.py 和 rating-questionnaire.json 放在同一分析目录，然后运行：

```powershell
python materials/analysis/analyze_story.py materials/P01/session.json materials/P02/session.json materials/P03/session.json > materials/analysis/participant-summary.csv 2> materials/analysis/descriptive-statistics.txt
```

多记录分析优先按学号辨认同一人，旧数据无学号时退回参与者编号。主要描述统计使用每人的首次研究记录；自由体验、重玩、未完成及缺失需如实说明。脚本按故事模型、原始应用版本和实际评分事件中的问卷版本组合分组；仍需人工核对题目语境与晚补回答，不能把未标记版本的数据当作新版数据。

建议形成三种输出：

1. 逐题评分表／点图：每人一行或每题一组，附有效 n、缺失、中位数与范围。
2. 问题证据表：界面问题、涉及哪些参与者、观察与引语出处、拟修改措施。
3. 联合解释表：量化现象、相关定性证据、支持／矛盾关系、谨慎结论。

游戏行为是模拟选择，不是实际减废量。决策时长包含阅读与思考，不等于识别延迟或界面错误。不得把高意向分、好看图表或新奇感直接解释为长期有效。

## 10 HCI 依据与研究者立场

可持续设计应考虑生活条件与社会文化语境，不只把责任归于个人选择 [3]。因此访谈会问资源与设施限制。说服式系统的设计与评估框架可用于说明原型为何呈现选择后果，但不提供“本原型已经有效”的证据 [4]。

身体与空间交互的文献可帮助审视手势、姿势和操作空间 [5]。本项目是摄像头手势界面，并没有可抓取的实体交互物件；不要把它直接写成已实现 tangible interface，也不能凭该文献推断手势优于鼠标。这些文献与本原型的具体连接属于设计者的应用解释。

COMP6390 的立场性陈述请基于你自己的实际经历回答：

- 我同时是开发者和研究者，期待作品成功，会不会影响提问、观察和选择引语？
- 我的软件背景是否让我更重视识别准确率，而忽略疲劳、阅读和参与者的理解？
- 我选择“少获取、少浪费”的价值取向如何进入选项、反馈和评分题？
- 我与参与者的同学关系是否让他们更愿意给高分？我如何邀请批评并记录反例？
- 我的语言、生活条件和校园经历是否令我高估某些减废选项的普遍可行性？
- 实际采取了哪些措施，又留下什么局限？

不要写成泛泛的“研究有偏差”，也不要编造自己没有的身份或经历。

## 11 最终报告和视频如何使用这些材料

沿用课程模板标题，分配正文篇幅给研究问题／计划／结论、原型设计与功能、数据／分析／发现，以及 COMP6390 的立场性陈述。建议先写证据再写结论；最终文字须控制在 1980 字词上限内，引用、图表和附录的计数规则以课程完整模板为准。

可安排 7 张幻灯片、约 300 秒：研究问题 35 秒；原型与手势演示 45 秒；评估设计 40 秒；量化结果 45 秒；定性发现 50 秒；改进与限制 45 秒；立场与结论 40 秒。此安排是建议，不是额外课程要求。只在收集真实资料之后填入结果。

提交前核对：原型可测试；3–5 名合格学生；参与者名单格式正确；每个发现有原始出处；至少 5 个来源在正文有编号引用；资料和脚本在 materials；视频 5–10 页幻灯片、本人清晰出镜和讲述、不超过 330 秒／1080p／100MB；按时推送至课程分叉仓库。

## 12 参考文献

以下为可用于设计与方法论的起始文献，正文只引用实际使用的内容。最终课程模板若规定更细的 ACM 格式，应按其规则调整。

1. United Nations Department of Economic and Social Affairs. n.d. Goal 12 Ensure sustainable consumption and production patterns. Retrieved October 27, 2026 from https://sdgs.un.org/goals/goal12
2. Virginia Braun and Victoria Clarke. 2006. Using thematic analysis in psychology. Qualitative Research in Psychology 3, 2 (2006), 77–101. https://doi.org/10.1191/1478088706qp063oa
3. Paul Dourish. 2010. HCI and environmental sustainability: The politics of design and the design of politics. In Proceedings of the 8th ACM Conference on Designing Interactive Systems (DIS 2010). https://www.dourish.com/publications/2010/dis2010-sustainability.pdf
4. Harri Oinas-Kukkonen and Marja Harjumaa. 2009. Persuasive systems design: Key issues, process model, and system features. Communications of the Association for Information Systems 24, Article 28 (2009). https://aisel.aisnet.org/cais/vol24/iss1/28/
5. Eva Hornecker and Jacob Buur. 2006. Getting a grip on tangible interaction: A framework on physical space and social interaction. In Proceedings of the SIGCHI Conference on Human Factors in Computing Systems (CHI 2006). ACM, 437–446. https://doi.org/10.1145/1124772.1124838

