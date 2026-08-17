[[2025-11-21]]
【SEP】Project-2: QBasic已经发布，截止时间为12月31日24点。进行编码前请仔细阅读实验手册，如有问题可以在答疑文档中进行提问~

[SJTU-SE-SEP2024/QBasic at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/tree/main/QBasic)

[Labyrinth0419/QBasic: SJTU2024 QBASIC大作业](https://github.com/Labyrinth0419/QBasic)

[Ayanami1314/qbasic](https://github.com/Ayanami1314/qbasic)

[1JI0O/SEP_QBasic](https://github.com/1JI0O/SEP_QBasic)
建立了一个私有库

实验文档：[https://notes.sjtu.edu.cn/s/NSfRuIN9O](https://notes.sjtu.edu.cn/s/NSfRuIN9O)
答疑文档：[https://docs.qq.com/doc/DQ1NoRFVmcnZWa29R](https://docs.qq.com/doc/DQ1NoRFVmcnZWa29R)

[Lab2: Y86-64 模拟器 - CodiMD](https://notes.sjtu.edu.cn/s/vx6SErIhT)

[支持幂运算的要求 · GitHub Copilot](https://github.com/copilot/c/0b463fb0-af99-4ef6-82f5-c201d7ddefae)

# **文档要求**
```
You only need to support +, -, *, /, MOD, (, ) operators with signed integers (at least 32-bit) in expressions. (Be aware of negative integers.)
```

```
Additionally, you need to support the exponentiation operator in expressions:

exp1 ** exp2

The exponentiation operator returns the result of exp1exp2, where exp1 and exp2 are expressions. The exponentiation operator is right associative, i.e., a ** b ** c is equal to a ** (b ** c). The operator has higher precedence than *, / and MOD.
```

```
For all expressions and statements, you need to handle extra spaces. For example, LET a = b + 4 * (-5 + 4 ).
```

[Summary-of-statements-available-in-the-minimal-BASIC-interpreter](https://notes.sjtu.edu.cn/s/NSfRuIN9O#13-Summary-of-statements-available-in-the-minimal-BASIC-interpreter)

## 3. Grading

- (10’) Your interpreter should be able to present a GUI and interact with user input.
    - GUI should contain the input and output interfaces shown in Figure 2.
- (20’) Your interpreter should be able to load and edit basic programs.
    - Users can add, update or delete statements through input box or LOAD button.
    - The statements entered by user can be stored and displayed in the correct order.
- (50’) Your interpreter should be able to interpret basic programs correctly.
    - Expression parsing (display the syntax tree, although this should be done when you store the programs);
    - Expression evaluation and statement execution (display the result of print if exists);
    - Runtime statistics display in the syntax tree;
    - Runtime context maintenance (e.g., the current line to be executed, all variables and their values).
- (10’) Your interpreter should be robust and correctly handle errors in the input.
- (10’) You should finish the project with object-oriented design and implementation; your code should be clear and easy to read with appropriate comments.
    - **You should manage the QBasic project using Git and include at least 5 git commits with different dates.**

和往年的区别是
- 好像往年要求debug模式，今年不要求了
- 今年新增了y86-64的

[[2025-11-25]]
参见[[SEP]]
- basic部分必做
- y86部分选做，作为bonus
参见 7.QBasic-ExpressionTree-Parsing-Evaluation-final.pptx


# 日志

[[2025-11-22]]

## 第一个目标：基础GUI和交互

就是把按钮connect到事件，还行，qt还可以自动完成，不用我手动写connect，不错

## 第二个目标：load and edit basic programs

唉，新建一个class，需要在qc中完成，不能只是在微软大战代码里面新建2个文件，否则qc识别不到

**你应该在 `cmdLineEdit`（命令输入窗口）里输入和编辑代码或命令，**  
而不是在 `CodeDisplay`（代码显示区）里直接编辑。

- `cmdLineEdit` 是用来输入新语句、修改、删除（通过输入行号+内容或行号）以及输入命令的。
- `CodeDisplay` 只是用来**展示**当前所有已存储的 BASIC 代码，不能直接编辑。

按照文档里面的说法
- **输入“行号+内容”就是添加或更新（update）该行。**
- **只输入“行号”就是删除（delete）该行。**

## 3.interpret basic programs correctly

### 3.1 Expression parsing

Expression parsing (display the syntax tree, although this should be done when you store the programs);

管他那么多，先建立一个 `expression` 类再说，然后往里面填充函数

妈的，感觉现在我是完全依赖copilot在写，ta写了些什么出来我也不知道，我觉得这样是不行的，考虑理解结构后自己写。但是借助ai的好处是可以快速上手，而且能被指引到一个相对正确的方向上，对结构也能快速建立起大体认知。

（[[2025-11-23]]批注：一些起爆信息参见[[text_collection]]同名文件）

从ttp群里获得了往年测试数据，放在根目录的上一个目录

[[2025-11-23]]
认为可以先让ai写一版出来，基于这个结构，我自己再去写。但是，我真觉得目前我的编程能力极大下降了，要写什么东西，第一反应是让ai去做，然后我去尝试理解，我觉得自己可能要完蛋了，妈的。

啊妈的，ai怎么什么都能干啊，相当于是把解析写完了，还添加了详细注释，而且一气呵成，直接就能跑，gpt5.1codex还是太厉害了。

逻辑大概是这样的

mainwindow处理事件逻辑，主要逻辑是lineedit输入框触发后的解析
每输入一行，都会把输入的东西解析，会按照空格分割输入，第一个是行号，只有行号就删除行号对应代码，后面有东西就解析语句，把第一个空格，比如`100 PRINT 200`，就是100加一个空格之后的位置后面的内容，也就是指令，通过program的addSource存储

program负责 BASIC 源码的存储、解析、语法树文本生成等核心逻辑
addSource会把传入的代码加入m_lines这个表，这个表的构成`std::map<int, LineEntry> m_lines;`，包含行号和LineEntry结构体，这个结构体包含raw原始指令字符和`std::unique_ptr<Statement> statement`已经被解析好的语句

但是在插入 map 之前先解析，确保语法错误立即暴露。这里的解析是调用`auto statement = parseStatement(trimmed);`，这里的trimmed是通过trim函数去除传入code字符串的首尾空白字符后的字符串。

关于parseStatement：
// 解析一行源码为 Statement 对象。
// 支持 REM/LET/PRINT/INPUT/GOTO/IF/END 及省略 LET 的赋值。
这个里面有很多个if，会先对指令类型做判断，然后基于指令类型，调用这个指令对应的parse函数，比如解析出来是LET指令，那么就会把let指令之后的东西传入`parseLet`函数

关于具体的解析函数
```cpp
    ExpressionParser parser(exprText);
    auto expr = parser.parse();
    // 用 ExpressionParser 解析表达式文本，得到表达式语法树（expr）
    return std::make_unique<LetStatement>(toUpper(variable), std::move(expr));
```
基本上最后都是这个样子的
- `exprText`是裁剪出来的表达式文本，用 ExpressionParser 解析表达式文本，得到表达式语法树（expr）
- 然后 创建一个 LetStatement 对象，返回给调用者
	- 返回指向 LetStatement 对象的智能指针

关于ExpressionParser
- 只在有表达式需要解析时被调用，把那个表达式传入进去

以上都是在program里面的逻辑，还有expression类和expresssionparser类没有看，妈的，唉，gpt5.1codex还是太厉害了。不过看起来还是挺优雅的，逻辑清晰，分层合理，十分赏心悦目。

接下来需要看的
- expressionparser.h
	- 然后是.cpp
- 然后应该要去看expression类，以及statement类

```
// ExpressionParser 负责对表达式字符串做递归下降解析，
// 将其转换成 Expression 抽象语法树，供语义分析与显示使用。
```

**关系总结**
- **Statement 里会包含 Expression**  
    例如 LetStatement 里有“变量名”和“表达式”，PrintStatement 里有“表达式”。
- **ExpressionParser 负责把字符串解析成 Expression**  
    语句解析时，遇到需要表达式的地方（如赋值、输出、条件），就用 ExpressionParser 生成表达式树。
- **Statement 代表一行指令，Expression 代表值或计算，ExpressionParser 是工具**  
    语句（Statement）= 指令  
    表达式（Expression）= 计算  
    解析器（ExpressionParser）= 把字符串变成表达式树的工具

1. Expression（表达式）
	- 代表“值”或“计算过程”，比如数字、变量、加减乘除等。
	- 例子：`1+2`、`A*B`、`(X-3)/Y`
	- 在代码中，Expression 是一个基类，派生类有 ConstantExpression、VariableExpression、BinaryExpression 等。
	- 作用：描述和计算等号右边、PRINT、IF等语句里的数学表达式。
2. Statement（语句）
	- 代表一条完整的 BASIC 语句，比如赋值、输出、输入、跳转、条件等。
	- 例子：`LET A=1+2`、`PRINT A`、`INPUT X`、`GOTO 100`、`IF A>B THEN 200`
	- Statement 是一个基类，派生类有 LetStatement、PrintStatement、InputStatement、GotoStatement、IfStatement 等。
	- 作用：描述一行 BASIC 代码的“做什么”动作。
3. ExpressionParser（表达式解析器）
	- 负责把字符串（如 `"1+2*3"`）解析成 Expression 对象（表达式树）。
	- 例子：`ExpressionParser("1+2*3").parse()` 会生成一个加法节点，右边是乘法节点。
	- 作用：只解析表达式，不管语句结构。

看了看代码库
- program.h里面include了statement.h
主要是用于那个结构体
```cpp
    struct LineEntry {
        std::string raw;
        std::unique_ptr<Statement> statement;
    };
```
这个结构体主要是program.cpp里面addSource函数
```cpp
    auto statement = parseStatement(trimmed);
    LineEntry entry;
    entry.raw = trimmed;
    entry.statement = std::move(statement);
    m_lines[line] = std::move(entry);
```
这里的move是转移智能指针所有权

对于program.cpp里面的一个expression解析例子
```cpp
    ExpressionParser parser(exprText);
    auto expr = parser.parse();
    // 用 ExpressionParser 解析表达式文本，得到表达式语法树（expr）
```

第一行：初始化了一个parser，初始化过程只进行了
```cpp
    // 把传进来的 source 字符串（表达式内容）保存到成员变量 m_source 里
    skipWhitespace();
    // 跳过 m_source 开头的所有空白字符，让 m_index 指向第一个有效字符
    m_current = readToken();
    // 读取第一个 token，并保存到 m_current
```

第二行，调用parser.parse，开始真正彻底解析，这个parse函数里面主要是
```cpp
auto expr = parseExpression();
```

关于`parseExpression()`函数
```cpp
// 解析表达式（从 最低优先级：加减 开始）
std::unique_ptr<Expression> ExpressionParser::parseExpression() {
    return parseAddSub();
}
```

那么为什么从加减开始呢

你的解析器优先级结构如下（从低到高）：
1. **parseAddSub**：加减（+ -），最低优先级
2. **parseMulDiv**：乘除和 MOD（* / MOD），中等优先级
3. **parseExponent**：幂运算（**），更高优先级
4. **parseUnary**：一元正负号（+ -），更高优先级
5. **parsePrimary**：基本单元（数字、变量、括号），最高优先级

为什么这样设计
- **优先级最低的函数作为入口**，因为它能捕获整个表达式的“主干”。
- 每一层只关心自己那一层的运算符，遇到更高优先级的就递归下去。
- 这样可以保证运算符优先级和结合性完全正确。

总结
- [parseExpression](vscode-file://vscode-app/d:/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html) 作为入口，直接调用最低优先级的 [parseAddSub](vscode-file://vscode-app/d:/Microsoft%20VS%20Code/resources/app/out/vs/code/electron-browser/workbench/workbench.html)，这样能保证整个表达式的优先级和结合性正确。
- 每一层递归下降函数只处理自己那一层的运算符，遇到更高优先级的就递归下去。
- 这种设计是递归下降解析器的经典写法，简单、清晰、易于维护。

关于文档的拷问
但**没有涉及递归下降解析器的实现细节**，比如“每一层只处理自己优先级的运算符”“parseExpression 直接调用最低优先级的 parseAddSub”这种设计思想。
文档只规定了语法和优先级，具体的解析实现方式（如递归下降、算符优先、手写状态机等）由你自己决定。你的实现方式（递归下降、优先级分层）是经典且正确的做法，但文档没有要求或描述这种实现细节。

妈的，这种东西我自己怎么想得出来？要是去查资料，那不如问ai，既然都问ai了，那还有什么好说的，直接vibe coding就行了，我真的是服了，现在想起来，[[CS231n作业]]光是注释都比se的总文档详尽且具体，妈的，抄都抄不明白。

一个例子
假如要解析
`1 + 2 * 3 ** 4 - 5`

步骤一：parseExpression

- 入口，直接调用 parseAddSub

步骤二：parseAddSub

- 先调用 parseMulDiv 解析第一个“加减项”
- 发现有 `+` 或 `-`，就循环处理下一个“加减项”，每次都用 CompoundExpression 连接起来

步骤三：parseMulDiv

- 先调用 parseExponent 解析第一个“乘除项”
- 发现有 `*`、`/` 或 `MOD`，就循环处理下一个“乘除项”，同样用 CompoundExpression 连接

步骤四：parseExponent

- 先调用 parseUnary 解析第一个“幂项”
- 如果遇到 `**`，递归处理右侧（右结合），用 CompoundExpression 连接

步骤五：parseUnary

- 处理一元正负号，如果有 `+` 或 `-`，递归处理下一个 parseUnary
- 没有则进入 parsePrimary

步骤六：parsePrimary

- 处理数字、变量、括号表达式


[[2025-11-25]]

16点18分 [[SEP]]课上 批注：
就目前而言，gpt5.1的实现方法和ppt上基本是一样的，不错，也许这个是最佳实践。

ppt里面 A Two-Level Grammar 这个是最基础的，没法实现优先级，只是作为知识点前置引入。这个在后面的 Ambiguity in Parse Structures 提到了

>1.请使用 Git 来管理项目，并且在验收时需要至少有 5 个不同日期的 commits

妈的，现在commits里面有我使用和骂ai的内容，考虑删库重开得了

>所以，文档没有强制要求你用 git 管理项目。是否使用 git 由你自己决定。

那不错，重新开一个库得了

此外，ppt的最后有Recommended Files，考虑基于此修改一下

tokenizer.h/cpp
Convert strings to a list of tokens
主要是这个东西没有实现，因为这个东西被集成到`ExpressionParser::Token ExpressionParser::readToken()`里面了

evalstate.h/cpp
A space storing all variables during evaluation
这个东西也没有单独拿出来实现
你已经实现了变量表的功能（用 std::map 传参），能支持变量的查找和赋值。
但没有单独的 EvalState 类/文件，也没有集中管理变量和运行时状态的对象。
我觉得这个东西有必要拿出来单独实现，因为后续可能会用到，而这个map可能不是很好用

但是话说回来，map已经足够好用了，我觉得不用实现evalstate.h/cpp也可以
不对，问题很大，这个东西居然没有一个初始化，是一个不断被传来传去的临时map，既然这样，需要建立一个evalstate类来保存这个东西

总体来说，问题不大，接着理解然后写就行了

此外，推荐写法里面“实现 Expression 的 parsing 和 evaluate（此时应该有完整的程序结构，链表+语法树）”，里面链表的作用应该是连接statement，但是这个写法可能有点麻烦，gpt5.1的做法是用map存储，我觉得很合理

---


看了看`statement`类，这个貌似主要是个辅助类，主要是记录有那些东西，以及输出语句树的时候，把expression输出之前的输出做好，比如说 语句类型 和 行号

继续看expression parser

关于加减法parser，
```cpp
    auto left = parseMulDiv();
    while (m_current.type == TokenType::Plus || m_current.type == TokenType::Minus) {
        std::string op = m_current.type == TokenType::Plus ? "+" : "-";
        advance();
        auto right = parseMulDiv();
        left = std::make_unique<CompoundExpression>(op, std::move(left), std::move(right));
    }
```
一开始时
- 先解析左边的乘除，是为了保证**加减法的每一项都已经把更高优先级的内容处理完了**。

然后进入循环
- 只要下一个符号是 `+` 或 `-`，就一直循环。
- 比如 `1 + 2 - 3 + 4`，有好几个加减号，所以会循环好几次。

循环里面

program里面建立一个evalstate类，然后把这个传入每一个expression
如何传入expression？
- program解析statement
- statement使用expressionparser
- expressionparser里面会构造expression，这个时候传入

不对，我认为expression本身在构造时不需要访问和记录evalstate
- 只需要在eval操作里面对evalstate进行读取运算就可以了
- 但是变量在一开始时是如何被传入evalstate，也就是如何传入之前那张表的呢

这个应该主要是在LET语句解析时完成的
let语句等于号右边的expression，会作为字符串被parse，然后不断递归，合成一个CompoundExpression，并且返回

所以整个parse整个构造阶段，并没有用到evalstate
by copilot
这些 eval 函数不会在解析（parse）阶段调用，而是在执行（execute）阶段被调用。
具体来说，只有在执行 LET、PRINT、IF 等语句时，才会对表达式求值。

问了问copilot，照理来说是在LET和INPUT指令被执行时把变量和对应的写入Evalstate，但是目前的代码逻辑里面好像没实现，见鬼了

我靠，怎么跑起来的，怎么解析的，见鬼了

妈的，当然能跑了，现在的代码树解析全部是基于抽象的结构，并没有涉及到具体的值，eval函数没有被调用，所以目前我的修改应该不会对程序造成影响

妈的，我总感觉现在的表达式树输出有点问题，好像是和顺序相关的问题

比对斐波那契实例程序，发现有这些问题
- 变量名这里全部转大写了，实际应该用小写
- if语句的解析有点问题，或者说顺序有点问题
- 有些缩进有点问题

现在if和print里面变量名还是大写的，考虑把所有toUpper都找到，挨个确认要不要。upper应该只用于把程序字符串转化成大写的，方便命令关键字匹配，比如let，lEt，都被处理为LET，方便查找。变量名就算了。

妈的，有点不理解，文档里面不需要输出“Exp”，但是一开始那个实例文件里面又有，见鬼了

indentSize是缩进，比如
```cpp
    oss << indent(indentSize) << m_variable << "\n";
    if (m_expression) {
        // 在 LET 语句中，将表达式整体向右缩进一层。
        oss << m_expression->toTreeString(indentSize + 4);
```
这样可以控制缩进大小，什么时候缩进，可以作为参考
总的语法树输出是由每个statement的语法树输出合成的，每个statement生成语法树时又会调用自己的expression的生成语法树函数

接下来需要完成的
- 弄懂parse部分是怎么解析的
- 完成execute部分

关于execute部分
- 每个 Statement 负责自己的执行逻辑。
- Program 负责主循环和跳转。
- EvalState 负责变量存储。
- 语法树和执行逻辑解耦，便于维护和扩展。

就是说
- 每个statement子类里面都要实现自己的execute函数
	- 这个过程会调用statement里面包含的expression的eval函数，也许
	- 跳转是个大问题
	- 这个过程中才会对evalstate进行写入和读取

`-(A + 2) * (B ** 3 - 4) / (C MOD 5)`
这个公式的解析

这个expression被传入parser构造函数，现在m_current是第一个token，也就是-，然后被调用parse()，调用parseExp，返回parseAddSub
调用加减解析，left为调用乘除解析的返回，乘除解析，调用幂解析，调用一元正负号解析，命中minus的if分支，执行advance，index变为1，current被赋值为`{TokenType::Minus, "-", 0}`
执行auto operand = parseUnary()，递归调用自己，现在m_current还是-，命中第二个if，再次advance，ch是左括号，index变为2，现在current是`{TokenType::LParen, "(", 0}`，执行`auto operand = parseUnary();`，再次递归调用自己，由于current是左括号，调用parsePrimary()，命中if \(m\_current\.type \== TokenType\:\:LParen)，再次advance，

妈的，不要这么复杂的例子，先从简单的看起，妈的，我简直是自讨苦吃，妈的

唉妈的差不多得了，我差不多理解这个parse在干什么了，太痛苦了，我不要学系统软件，我是弱智，唉无论如何这个qbasic需要被继续推进了妈的。

现在，我想实现execute功能，以下是简要的大体结构
- 每个 Statement 负责自己的执行逻辑。
- Program 负责主循环和跳转。
- EvalState 负责变量存储。
- 语法树和执行逻辑解耦，便于维护和扩展。

我的需求是
- 我想知道应该在哪些类里面实现哪些函数
- 我不要求具体的函数实现，但是希望你给出一些注释，说明这个函数需要做什么
- 使用中文回答
- 依托已有的函数框架，尤其是evalstate类

gpt5.1的意思是把program作为execute函数的一个参数，但是这样会导致statement和program相互引用

>program里面引入了state，state里面又引入了program，这不好吧，https://github.com/overji/SJTU-SE-SEP2024/tree/main/QBasic 这个人是怎么解决的，对于需要输出的东西，既然这是qt，能不能通过信号函数通知program输出

by gpt4.1
- `Statement` 或 `Program` 不直接输出，而是发射信号（如 `void output(QString)`）。
- 主窗口（或控制器）连接该信号，将内容显示到 QTextBrowser 或其他控件。
- 这样，执行层和界面层完全解耦，便于维护和扩展。

我觉得还是这样好一些

[[2025-11-27]]
- 有点问题，假如说通过信号来让program或者window显示东西，那么如何把要显示的东西传进去呢？考虑借鉴一下overji的做法，或者问问ai
- execute指令是void，感觉有点怪，比如goto时，如果是void，那么如何把计算得到的跳转指令告诉program？考虑问ai，参考overji。感觉架构这一块还是不是很明白


[[2025-11-27]]

详细展开讲解 overji/SJTU-SE-SEP2024/QBasic 项目中 EvalState 持有输出流（如 std::ostream&）的设计思想、实现方式及其优点
- **解耦执行与输出**：  
    让 `Statement` 只关心“我要输出什么”，而不关心“怎么输出、输出到哪里”。  
    这样，执行逻辑和输出逻辑分离，方便后续切换输出目标（如文件、控制台、GUI等）。
    
- **依赖注入**：  
    通过构造函数或 setter，把输出流（如 `std::ostream&`）传给 `EvalState`，所有需要输出的地方都通过 `EvalState` 获取输出流。

4.在 Qt 下的进一步优化

如果你想输出到 Qt 控件（如 QTextBrowser），可以自定义一个继承自 `std::ostream` 的类，将数据写入 Qt 控件，然后传给 `EvalState`。

我靠，这个实现好奇妙，还能这么解耦合的，不错

# execute

我靠，gpt5.1怎么又实现完execute了，妈的，写了很多东西，太吓人了。

但是有问题，执行会报错，唉，看来我需要看懂逻辑，然后debug，那也行

#todo 目前execute阶段还要做的
- print语句，如何关联到输出流
- 之前输入了140 print c，然后程序就崩溃了，如何检查
	- 我怀疑这个和读入文件和命令框输入文件的逻辑不一样，需要看看
	- 读取文件真的可以正常解析吗
- 看懂ai究竟实现了哪些功能，看看

[[2025-11-29]]

这类 “undefined reference to Program::printRequested(QString const&)” 的链接错误，几乎都是 **moc 没跑** 造成的：

**重新运行 qmake / cmake**（或在 Qt Creator 里 “运行 qmake” / “重新配置”）

试了试，现在已经能跑起来了，但是MOD的结果和ai分析的不一样，根据文档

```
The MOD operator has the same precedence as * and /. In the expression LET r = a MOD b, the absolute value of r should be less than the absolute value of b, and the sign of r is the same as that of b. For example, 5 MOD 3 is 2 and 5 MOD (-3) is -1.
```

by copilot
它规定了MOD的行为与我们常见的（C/Python/BASIC等）实现都**不完全相同**！

关于现在的print到ui->textBrowser逻辑是怎么实现的：

statement-print的execute会`throw PrintSignal(std::to_string(value));`
program的run函数
```cpp
catch (const PrintSignal& print) {
            // ui->textBrowser->append(QString::fromStdString(print.text()));
            emit printRequested(QString::fromStdString(print.text()));
            ++iter;
```
会接收到信号，但是program不应该直接对ui进行操作，这个是mainwindow干的事情，我们要解耦合，就需要用到信号。

qt里面信号发送：
- Qt 信号/槽机制只能在 QObject 派生类之间用（比如 MainWindow、QWidget 等），而你的 Program/Statement 不是 QObject 派生类，不能直接 emit 信号。

基于此，要让program是QObject派生类
```cpp
class Program : public QObject{
    Q_OBJECT
```
定义里面要声明
```cpp
Program::Program(QObject *parent)
    : QObject(parent)
{
    // pass
}
```
也要写构造函数

在此之后，在mainwindow初始化时
```cpp
MainWindow::MainWindow(QWidget *parent)
    : QMainWindow(parent)
    , ui(new Ui::MainWindow)
{
    ui->setupUi(this);
    connect(&program, &Program::printRequested, ui->textBrowser, &QTextBrowser::append);
}
```
就可以connect了

总结：相当于是通过两种不同的信号传递方式把print内容从statement接力从program中转到ui了

```bash
terminate called after throwing an instance of 'std::runtime_error'
  what():  Runtime error at line 160: Division by zero
```

原来除以0后程序会直接崩溃，这个需要解决，应该是跳出一个窗口提示除0了

```cpp
    try {
        program.run();
    } catch (const std::exception& ex) {
        showError(QString::fromUtf8(ex.what()));
    }
```
现在会catch了

其实也不完全对，在program::run里面
```cpp
        } catch (const std::exception &ex) {
            throw std::runtime_error(
                "Runtime error at line " + std::to_string(iter->first) + ": " + ex.what());
        }
```
已经对run过程中遇到的问题进行catch了，并且实现了重新包装，iter->first就是当前语句的行号，因此只要语句执行中（比如表达式求值）抛出异常，都会带上 “Runtime error at line XXX: …”。

但是如果mainwindow里面只是run，那么这个报错提示就只会显示在终端中，而且会让程序自己崩溃结束。

所以要在mainwindow里面的runbtnclicked中catch并且显示为独立报错窗口，才可以

关于除法
- Minimal BASIC 只要求支持**有符号整数**（signed integers，至少32位），不要求支持小数。
- 表达式只需支持 `+, -, *, /, MOD, (, )`，且所有运算都在整数范围内进行。
- 除法 `/` 也是整数除法，结果会直接截断小数部分（即 5 / 2 = 2）。

比如1/2得到0

程序里的第 9 行 INPUT N 会要求用户输入一个整数。你现在的 EvalState 仍然用 std::cin / std::cout，所以它会在 终端 打印 ? 并等待输入，而不是从 Qt 的文本框读数据。当终端里没有输入（或输入的不是整数）时，它就一直读到流失败，于是进入 INVALID NUMBER 循环。

我靠，还有这个问题，见鬼了

以及一个好消息，从ttp群里获得的测试代码不仅有源代码，还有输出和tree结构，太好了

关于input需要解决的
- 不是从editline里面输入的
- 报错不是用的标准报错，是乱实现的，没法被catch到

妈的，gpt5.1对程序进行了大改，司马东西
- 它貌似对输入过程中按下了其他按钮很在意
- 貌似对程序运行状态维护很在意
这些确实是需要考虑的，但是它的改动太多了

不行，evalstate还得是program来管理，作为一个成员变量

## gpt5.1 对 input 的实现

gpt5.1codex的
第一步  
- Program.h 现在直接包含 EvalState 并新增成员 EvalState m_state;，这样 Program 的变量/IO 状态在多次运行间保持一致，便于之后的暂停-恢复。  
- Program::run() (Program.cpp) 改为直接调用 run(m_state);，不再创建临时 EvalState，为后续 INPUT 挂起后恢复执行奠定基础。

第二步

- Program 现已具备等待输入的内部状态：新增 `m_waitingInput`、`m_pendingInputVar`、`m_pendingLine` 三个成员用于记录当前是否处于输入挂起、等待的变量名以及挂起那一行。
- 通过对 QString 做前向声明避免额外包含，保持原有注释不变，也没触碰执行逻辑，为下一步接入 InputSignal/界面交互铺好地基。

然后

- Statement.cpp 的 INPUT 执行逻辑彻底改成 throw InputSignal(m_variable);，不再进行流式输入/输出，也不会打印 `"INVALID NUMBER"`；后续合法性校验会在 UI 层完成。
- 删除了无用的 `<limits>` 头文件，并显式忽略 state 参数以强调 INPUT 现在只负责抛信号。  
    这个主要是对input语句execute的结构大改，现在输入和输入校验不是由这个execute完成了

鉴于月底了，copilot额度还没用完，那就狠狠用，反正下周一额度就重置了。

- 在 Program.h 中新增 resumeInput 槽和 inputRequested 信号，并补充用于挂起/恢复输入的成员 (m_pendingInputVar(字符串/QString), m_pendingLine, m_resumeAfterInput, m_resumeLine)。
- Program::run(EvalState&) 现在会在收到 InputSignal 时记录挂起行和变量名，`emit inputRequested(...)` 后直接 `return` 暂停解释器；若是来自 resumeInput 的继续执行，则会从刚才那一行的下一行继续跑。
- 新增 Program::resumeInput(const QString&): UI 回传字符串后在这里完成整数校验（非法输入直接 `throw std::runtime_error("INVALID NUMBER")`），写回 EvalState，重置挂起状态，并自动继续解释器。

确认这一步 OK 后，我再往下接 MainWindow 的连接与 UI 输入模式。

- 在 Program.h 中为新增的槽/信号以及挂起状态成员逐一补充了注释，说明它们在 UI 输入流中的职责（何时触发、存的是什么、为何需要两份变量名等）。
    
- 在 Program::run 内部，对 INPUT 暂停与恢复的控制流加上解释，标注了“等待输入直接返回”“resumeAfterInput 如何定位下一行”等关键逻辑。
    
- Program::resumeInput 也加入了输入校验与状态回写的说明，强调先判空/校验，再写回变量表并触发下一轮 run()。
    
- MainWindow 现已完整接入 Program 的 INPUT 信号：在构造函数中记录输入框原本的 placeholder，新增 onInputRequested 槽，与 Program::inputRequested 建立连接。
    
- 命令行输入框现在分两种模式：普通模式继续解析行号指令，输入模式则把用户输入直接交给 Program::resumeInput，根据异常类型决定是继续等待（`INVALID NUMBER`）还是退出输入模式并恢复按钮。
    
- 新增 enterInputMode/leaveInputMode 辅助函数，负责切换 UI 状态（禁用 RUN/LOAD/CLEAR、更新 placeholder、聚焦 editline）。RUN 按钮在等待 INPUT 期间会提示“请先完成输入”，避免用户重复点击。
    
- Program.h / Program.cpp 里，新增的槽、信号和状态成员都补上了逐条说明：resumeInput 的 5 步职责、inputRequested 的触发时机、以及每个挂起字段在暂停/恢复中的具体作用；run 与 resumeInput 内也用分段注释描述了响应流程（如何阻止重复 run、如何记录断点、捕获 InputSignal 后的四个动作、resume 时的校验与状态重置）。
    
- mainwindow.h / MainWindow.cpp 针对 UI 输入流程写了详细注释：构造时如何连接信号、on_cmdLineEdit_editingFinished 两种模式下的分支逻辑、RUN 按钮在输入模式的防护、以及 enterInputMode/leaveInputMode 在禁用按钮、设置提示、恢复界面等方面的具体步骤。

以上内容还是直接看对话比较方便

唉，然后gpt5.1codex又实现了所有功能
#todo 现在我需要做的
- 理解它写了什么，逻辑是什么
- 修改和添加注释，让它能被看懂
- 还有就是那个emit，主要是PRINT部分的信号，为什么可以携带一个string参数，还能被接收到，这个机制有必要了解

此外，看了看，现在任务文档大改了，发现y86部分只要能正常处理测试用例里面哪些就可以了，那还有什么好说的，all in vibe coding就行了

## qt信号-槽机制 for print

```cpp
# program.cpp run 里面 catch (const PrintSignal& print) 后
emit printRequested(QString::fromStdString(print.text()));
# mainwindow 初始化中
connect(&program, &Program::printRequested, ui->textBrowser, &QTextBrowser::append);
```

你可以把它理解为“函数回调”，只是回调的发起方换成了“信号”，而参数通过签名匹配自动传过去：

- 信号签名：`printRequested(const QString&)`
- 槽签名：`append(const QString&)`
- 发射时带上一个 QString，Qt 就会把它传给槽。

为什么这样写就可以？

- 因为 Qt 的“元对象系统”（MOC）会为每个QObject 子类生成“信号和槽的签名信息”，包括参数类型。
- connect(...) 会检查“信号的参数类型列表”和“槽的参数类型列表”是否一致或兼容。
- 一致时，发射信号 emit 就能把参数交给槽函数（同线程下是同步直接调用；不同线程时会排队到对方线程执行）。

所以，简单来说：

- 你定义信号时写上参数类型；
- 你发射信号时传入具体参数；
- 你连接到一个槽，而且槽的参数类型和信号一致；
- Qt 就会自动把参数传过去，这就是“信号可以携带参数”的机制。

- 信号和槽的参数类型、数量、顺序要一致（或兼容）。
- 槽就是一个可以被信号自动调用的函数。
- 你可以把它理解为“回调函数”，但 Qt 会自动帮你完成参数传递和调用。
- 槽就是一个普通成员函数，只要签名匹配，就能被信号自动调用。
- 信号发射时，参数会自动传递到槽函数，实现“解耦的回调”

比如你想让 PRINT 输出到多个地方，可以写：
```cpp
void MainWindow::myPrintSlot(const QString &text) {
    ui->textBrowser->append(text);
    // 还可以写到文件、日志等
}
connect(&program, &Program::printRequested, this, &MainWindow::myPrintSlot);
```

---

很好，execute已经差不多完成了，我也理解了，接下来要做的
- Runtime statistics display in the syntax tree;
	- 数里面显示运行次数和变量值什么的
- Runtime context maintenance (e.g., the current line to be executed, all variables and their values).
	- 这个好像已经完成了，iter和state

# Runtime statistics display in the syntax tree

[[2025-12-02]]
•关于项目要求，corner case等，大家多关注下公开的腾讯文档里更新的内容

这节课是关于qt-ui，主要是connect，没什么特别重要的。


```
5 IF THEN 901 1
    d
    >
    0
    7
```

貌似我的程序这里会先显示>，然后才显示d，有点问题

现在还有个问题，let语句需要显示变量的值

```
IF statement is a little special. You need to count how many times the branch is taken (the condition is satisfied) and not taken (the condition is not satisified) separately. For example, if an IF statement was executed seven times and the condition was evaluated to true for three times and false for four times, you should print “3 4” after “IF THEN” in the syntax tree:
```
这里还没做，现在只显示总执行数目

```
For LET statement, the number of times that the variable was used (use count) is also crucial. This count should be printed in the second line of the syntax tree, right after the variable name:

In the example above, the LET statement was only executed once, but the variable m was used ten times. If variable names of multiple LET statements are identical, they share the same use count.

Note that a variable may be used multiple times in one statement. For example, in PRINT b * b + b, the variable b is used three times. If this PRINT statement is executed ten times, it will contribute 30 times to the use count of variable b. Variable assignment itself does not contribute to use count. For example, LET m = 1 does not increase the use count of variable m.
```
这里也没做

bodyToTreeString貌似运行时不是在这里面实现的

- 你要全局统计每个变量在所有表达式中被“读取/引用”的总次数（乘以语句执行次数），
- 并在每个 LET 语句的语法树第二行（变量名那一行）后面加上 `[use=次数]`，
- 变量名相同的 LET 语句共享同一个 use count。

不行，关于let语句，不能把一个变量用了几次写入evalstate，这个每次是要清零重来的，但是解析貌似不用。

EvalState 只负责变量的值，与“统计用途”无关。
统计变量出现几次的map应该放在program里

关于语法树展示
- 程序读入/一行写入时，会把结构展示在语法树中
- 程序执行时，会每执行一个语句，都会statementExecuted();更新

```cpp
// 获取所有语句的语法树文本，供 GUI 展示。
std::string Program::getSyntaxTreeText() const {
    std::ostringstream oss;
    for (const auto& [line, entry] : m_lines) {
        if (!entry.statement) continue;
        oss << line << " " << entry.statement->headerWithStats() << "\n";
        std::string body = entry.statement->bodyToTreeString(4);
        if (!body.empty()) {
            oss << body;
        }
    }
    return oss.str();
}
```

认为这个不能每执行一个语句，就更新一次，应该等全部都执行完了再更新再显示。这样速度也很快

- 文档在“Runtime statistics display in the syntax tree”部分明确写道：  
    “After each execution finishes, you should print how many times each statement has been executed on the syntax tree. These counts need to be reset at the beginning of RUN command.”
- 这句话强调了“每次执行结束后”才需要在语法树中显示统计信息。
- 以及需要reset


考虑run之前的状态树展示就只做结构展示，不要把状态显示为0，等到run之后再调用显示状态的状态树

妈的，cpp里面是true false，首字母不大写！

`m_` 这种前缀是一种常见的 C++ 命名习惯，表示“member”（成员变量）的缩写。  
它用于区分类的成员变量和局部变量或参数

现在要做的
- 完成let的统计
	- 这个应该要跨program-statement-expression结构
- 需要把运行前的结构展示和运行后的结构展示分开
	- 目前toTreeString被getSyntaxTreeText(bool isRun)用到
	- std::string body = entry.statement->bodyToTreeString(4);
	- 既然let变量用到次数统计是和变量相关的，那么应该写到bodyToTreeString里面，所以那个也要分情况显示，或者实现对陈的xxx_run函数

自底向上实现
- expression里面每种expression都把变量统计写入一个map
- statement里面print,if,let子类，类似方法去调用expression里面的方法
	- 调用时，statement里面是接收到来自program的varUseCount，然后它把这个东西的引用传入expression，叫做useCount
	- 由于是++，所以可以实现累加
```cpp
void IdentifierExpression::collectVarUses(std::map<std::string, int> &counter) const {
    ++counter[m_name];
}
```
- program里面调用
	- 开始运行时，对于每条正确执行的语句
	- `statement->collectVarUses(varUseCount);`

19点36分 那么运行状态树就差不多实现了，接下来要做的
- 有些顺序还是有点问题，尤其是if里面变量名和比较符号谁先出现的问题，需要修复
- 一些缩进问题，可以问问助教缩进问题
- y86的实现

妈的，还是在vibe coding，但是这个真的太快了，我需要拥抱时代，学习ai是怎么写的，模仿其优秀写法，同时理解它写了些什么，以及学习vibe coding技巧

#### [[2025-12-09]]

==关于答疑文档==

行号需要为不超过1000000的正整数，否则提示用户行号错误。
这个需要考虑
```
    if (!ok || line <= 0 || line > 1000000) { 
        showError("请输入合法的行号");
        return;
    }
```
18点35分

【问题】CLEAR指令
【回答】除了清理界面，还需要清除程序中的所有状态。
这个指令好像我没有支持，也许应该再看看文档，要求实现哪些东西

【问题】输入指令LIST时，是不是程序直接忽略这条指令就可以了？
【回答】直接忽略，不用报错。（相当于识别了这个指令，但是什么都不做就完成了）
这他妈的是什么

【问题】用户的代码以及用户对INPUT语句的输入中有可能会出现浮点数吗？
【回答】测试里面不会有这个情况，但是你可以通过报错或者只读整数部分来处理。
需要看看解析逻辑
==会报错，因为.不在解析逻辑里面，没法解析，所以会报错==

【问题】QBasic的变量名有和C++一样的限制吗？如INPUT 1a或者INPUT IF这种合法吗？
【回答】变量名需要遵守C/C++的要求，即不能是关键字（比如IF），也不能以数字开头。例如1a和IF这样的变量名是非法的。
变量名合法性校验也要做

对于类似GOTO的行号不存在这种问题，在输入指令时无法检查是否存在该问题，因此在运行时才需要对这种错误报错。
需要看看这个goto的错误捕捉写没写

**Commands to control the BASIC interpreter:**

- **RUN**: This command starts program execution beginning at the lowest-numbered line. Unless the flow is changed by GOTO and IF commands, statements are executed in line-number order. Execution ends when the program hits the END statement or continues past the last statement in the program.
- **LOAD**: This command loads a file containing statements and commands. Statements and commands should be stored (also displayed in GUI) and executed respectively, as if they were entered into input box in order. A prompt window should be displayed when this command is entered. The window asks users to choose the file to load.
- **LIST**: This command lists the steps in the program in numerical sequence. It has been required to be implemented in the previous version of this project. In the new version, your interpreter should be able to display all the codes that have been entered in real time, ==so there is no need to implement this command.==
- **CLEAR**: This command deletes the program so the user can start entering a new one.
- **HELP**: This command provides a simple help message describing your interpreter.
- **QUIT**: Typing QUIT exits from the BASIC interpreter.

妈的，还有这些指令要处理

在y86之前要完成的
- 新的指令处理 ==done==
- 语法树显示修复
	- 尤其是if语句的输出先后
	- 还有一些缩进问题
- 再次复习整个代码框架
	- 建议从mainwindow开始一层一层往下看，知道每个函数在干什么
- 变量名合法性校验


```
2020 PRINT
    +
        +
            2020
            -
                0
                2
        3
```

这里是把-2当作0-2处理了，有点难搞

那么只处理-号后只跟了一个数字的情况，把这个单独拿出来处理，其余情况，比如`-(a+b)`，还是构造成一个compound，也就是0 - (a+b)

坏了，怎么现在let不显示使用次数了，见鬼了
点击执行按钮，上次的运行状态也没删除，见鬼
但是非hard部分，好像let等状态是正常显示的，说明问题在input指令处理上

- 文档在“Runtime statistics display in the syntax tree”部分明确写道：  
    “After each execution finishes, you should print how many times each statement has been executed on the syntax tree. ==These counts need to be reset at the beginning of RUN command==.”

需要看看run之前有没有清空语法树的状态显示状态
是清空了的，参见无参数和有参数的run函数

```
        try {
            // 将值交给 Program::resumeInput。若输入非法，
            // resumeInput 会抛出 std::runtime_error("INVALID NUMBER")，
            // 我们捕获后弹窗提示，并继续停留在输入模式等待下一次输入。
            leaveInputMode();
            program.resumeInput(value);
            refreshDisplays();
            // 上面的resumeInput会执行一个run
            // 但是refreshDisplay需要在mainwindow这一层执行
```

之前主要是input后，try了resumeinput，但是没有加上refreshDisplays();调用，于是没有显示出来

18点31分 不错，完成了不少东西，接下来
- 再次复习整个代码框架
	- 建议从mainwindow开始一层一层往下看，知道每个函数在干什么
	- （其实这个通过今天下午的编程，已经基本上过了一遍了）
- 变量名合法性校验
	- 这个需要考虑
	- 这个应该在program里面，let语句和input语句的处理时进行
	- ==done==
		- 在program里面整个了函数干这件事
- 然后就是y86

有一说一，今天下午写得还挺爽的，因为我知道我要写什么，也能写出来，不是完全让ai去做，然后我再理解ai输出了一堆什么东西。

基于此，接下来要做的就是推进y86！


## [[2025-12-16]]

```prompt
仔细阅读这个要求文档（Minimal Basic (or QBasic) - v2.md）中的## Bonus Part: Compiling BASIC `LET` Statements to Y86-64部分，看看要干什么，如何结合我已有的代码实现，此外，格外注意以下要求，尤其是只需要适配那几个测试case，里面只有let语句和部分运算，换言之，你不必实现完整的编译器，只需要能覆盖测试用例就可以了，当然这个是建议，具体还是以文档为准

**How to get started?**

- First of all, you should finish the QBasic interpreter in the first part, so that you can parse the syntax tree successfully.
- Then the most important part is experssion evaluation. Every expression is a syntax tree: a root node(operator) and two child nodes(operand), you can translate it to(if operator is add):
    
    ```
    # assume the operands are already in the stack
    popq %rax           # get the first operand
    popq %rbx           # get the second operand
    addq %rbx, %rax     # do the operation
    ```
    
    - But if an expression is the operand of a bigger expression, such as expression `A + B` and `C + D` are operands of expression `(A + B) + (C + D)`, **you need to solve it using recursion**.

**Testcase**

We will give you all the test cases(in the `y86-testcases` directory), you need to present the generated `.ys` file when checking the project.

我的要求是
- 使用中文回答
- 得到我的允许前，不允许修改代码
- 你可以阅读整个代码库

我希望你做的
1. 阅读文档和代码库，生成大致的方案，让我审查与提出建议
2. 一步步实现，不要破坏原有代码，每生成一批代码，你需要详细讲解你干了什么，并且添加必要的详细注释，让我确认后才能继续
```

```
To make this project feasible, we will limit the scope to a single, essential statement: LET. Your task is to modify your QBasic project so **it can take a BASIC program file containing only LET statements and generate a valid `.ys` (Y86-64 assembly) file.**
```
看了看，还真的是只用支持LET


```prompt
你做得很好，我有以下要求
- **测试流程**，这个不用你完成，我自己即可完成
- 解析时，如果遇到一个程序有除了LET以外的语句，直接禁止转y86
- 关于转y86的流程，ui不要动，而是点击运行按钮后，跳出提示框
	- 如果程序里面有非LET语句，不允许转y86，直接一个提示框说明
	- 如果可以转LET，跳出一个提示框，包含是和否，点击是，那么进行转y86流程

现在，请你开始第一步
```

```prompt
你做得很好，接下来我的要求是
- 实现真的转y86，如果这个东西能用少数函数实现，并且不是很长，那么就写成一个函数，如果不能，请封装成一个类，但是你最好修改qmake文件，否则读不到
- 关于报错，使用qmessagebox

现在，请你继续，但是，不要一口气全部实现，一步步来，每一步都向我确认，按照之前要求，同时使用中文回答
```

```prompt
导出形式：弹出文件管理器，选择保存在什么地方
封装方式：单独一个类
运行库内容：你说得对，先实现最小可运行版本
UI流程：你说的对，就这么办
```

```
你的实现思路是好的，但是有些细节我希望你修改，比如那些getter函数，例如left()，我希望你将其名字改成getLeft这样，其他函数名字也相应修改，先完成这个操作；此外，解释一下snapshot是干什么的，有没有更直接的实现方式
```

#### [[2025-12-17]]
08点48分 我发现早上用gpt5.1会很快，基本不需要什么思考和等待的时间，也许是因为这个时候大部分使用者还没起床。

测试了一下，差不多可以了，那么y86这一块就差不多完成了，但是
- 这个没有标准答案，到时候可能会受到助教的拷打，因而需要理解写了什么，添加一点注释，理解流程，顺便把整个项目复习以下
- 运行库那一块，需要自己理解看看

**Please compress your source code using 7z and upload the 7z file to [oc.sjtu.edu.cn](http://oc.sjtu.edu.cn/) before the final deadline.**
需要自己打包上传canvas

#### [[2026-01-01]]

复习qbasic有感：这个东西这么复杂，我是怎么通过拷打ai写出来的，ai怎么这么厉害

#### [[DailyNotes/2026/01/2026-01-04|2026-01-04]]

【QBasic验收提醒】
1. 明天（1.5）将进行QBasic验收，请大家做好准备，查阅顺序表，提前10-20分钟到达验收教室。
2. 上午和下午最多可以有三位同学同时验收（顺序表原定为两组），原定验收时间靠后或者时间段靠后的同学提前向助教申请后，可以提早验收。
3. 验收时需要读取U盘中的文件，如果电脑只有USB-C接口，建议携带拓展坞或转接头。（如果没有的话助教也会准备）

基于此，考虑回去再对照着本地那些测试用例看看，不仅是输出，还有语法树什么的
以及导出y86的功能也要测试一下，看看是否真的可行

特别提醒，明天的验收地点为【东中院 4-301 教室】，不是上课教室，请勿走错。验收时间靠后的同学，可以向助教申请提前验收。

展示GUI界面演示功能，然后我们会提供一些测试用例进行测试

#### [[2026-01-05]]

进行了答辩，感觉糟糕，但是还好
- 主要是可以不输入行号输入一行程序，那么就直接执行，这个东西我没做
- y86，助教还是问了，我说是ai写的，助教啧啧称奇，说愿意了解一下也是挺好的

好消息是
- 这个助教人不错，不怎么拷打
- 3个助教同时答辩，最右边一个有点严格，我对应的助教是中间那个，还好
	- 注意到助教之间拉了个小群

