#### [[2025-05-28]]
一两周冲刺，大概率只能拿到0分，需要投入一些时间去做

#### [[2025-06-23]]
[SJTU-SE/awesome-se: 👨‍💻 ❤️ 💻 上海交通大学软件学院本科编程作业参考](https://github.com/SJTU-SE/awesome-se)

[Ayanami1314/QLink](https://github.com/Ayanami1314/QLink)

[SJTU-SE-SEP2024/QLink at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/tree/main/QLink)

#### [[2025-06-24]]
发现要打开之前的项目，需要打开文本`CMakeList.txt`，然后才能识别到整个项目

注意到有个ppt，专门讲解qtmap生成，这个入门指导还挺好的。
tmd，原来是在官方案例基础上魔改的。

完全照搬qt-map，完成了step1

原来ctrl+n新建的第一个选项，可以.h和.cpp同时建立，我真的是baka

[SJTU-SE-SEP2024/QLink/LinkGame.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/LinkGame.cpp#L405)
初始化地图
[SJTU-SE-SEP2024/QLink/LinkGame.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/LinkGame.cpp#L357)
初始化箱子

paint画出来的东西和这个东西本身有区别，比如碰撞检测可以和画出来的东西无关，只要它代表的那个东西逻辑上检测到就好了。

QLinkGame统领全局，在里面会有总的paint event，绘制player and map
inside map, we draw boxes

遇到了`undefined reference to vtable for QLinkGame'`的问题，发现在.h里面写了函数声明，那么在.cpp里就需要实现

还是参考overji的代码，设置一个BoxOnMap类，它实际上负责绘制box，但是绘制box也就意味着绘制地图。后面的hint等东西就画在BoxOnMap上

既然drawmap只是画格子，那么没必要专门整一个map类，只需要在QLinkGame里面整一个drawMap就可以了。但是同时注意到应该还有一个initMap函数，那么需不需要弄一个Map类

既然box只是单独的抽象的格子，那么设置颜色，设置位置等都需要在map类中完成，所以还是需要一个map类

既然每个box要是可以交互的，那么还是参照overji的做法，建立一个box数组

需要初始化box数组里每个box的坐标，也就意味着box类里面需要定义，
坐标初始化在mapinit函数里面实现
[SJTU-SE-SEP2024/QLink/LinkGame.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/LinkGame.cpp#L405)
initmap在这里

resize需要考虑下，实现是需要考虑的，但同时也要考虑resize的函数实现，比率变量，究竟是在map类里面还是game类里面，我偏好后者，毕竟如何画
[SJTU-SE-SEP2024/QLink/LinkGame.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/LinkGame.cpp#L193)
这个是resizeEvent，注意到game类里面和box类里面都有盒子的长宽，坐标等，等到resize时，同时在box类里面也定义resize函数，通过传入修改后的值，改变绘制。

妈的，我现在知道为什么有那么多获取值与修改值的函数了，妈的，都是因为该死的类。

#### [[2025-06-25]]
我感觉放缩比例还是有必要在map类的initmap里面用到的，毕竟要计算出每个box的尺寸和坐标，那么就必须要用到，考虑从game类传入，或者怎么着。

注意到overji里面有个passagewidth，感觉有道理，不然人物没法深入到方格群内部，不好消除，但是话说回来，我觉得人物也可以在边缘动，然后逐步深入。认为
- 这个功能不难加，只需要在initmap里面修改下就可以了
- 需要看看别人的连连看实现出来是什么样子的

maybe in mapinit "// 随机填入一个类型的box" can be made into a function, which is esay to modify in the future, this function is realized in class map as it 只决定填入概率的数组，不对箱子本身坐标尺寸等造成修改

[SJTU-SE-SEP2024/QLink/LinkGame.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/LinkGame.cpp#L82)
注意到有
```
void LinkGame::initGlobalBox(const int &M, const int &N)
{
    //初始化箱子的种类对应颜色，初始化boxMap和boxType大小，M:箱子行数，N:箱子列数
```
这么个函数，妈的

12点45分 太好了，采取我的架构，把地图画出来了，这是个伟大的进步！现在需要解决地图不居中的问题。此外，貌似窗口放缩不起作用，这也是需要解决的问题。

发现现在的xRatio,yRatio只在init时被设置，换言之拉伸窗口后即使这2个值变了，也不会影响绘制，这个需要解决。确实，overji也有个resizeBox函数，game类有个resizeevent函数

关于地图不居中，也许这个就是passage尺寸存在的意义，它不是让相邻方块之间有空隙，而是让窗口左上角有空隙。

关于resizeEvent：
- `show()` 会间接触发 `paintEvent` 和 `resizeEvent`，尤其是在窗口首次显示时。
- 但它们的触发机制还依赖其他因素，例如窗口是否需要绘制或调整大小。
- 如果你希望精确控制这些事件，可以通过显式调用 `update()` 或 `resize()` 来触发它们

motherfuckers if i wanna realize resizeEvent i have to modify the values of boxMap, but their values are private so i have to write extra functions to set them

fuck 现在的放缩逻辑反了，会想着反方向压缩拉伸，妈的。妈的，是乘以ratio，不是除！

the edge seems to be better in Qt::gray than blue and white

妈的，我现在似乎理解为什么overji的原始放缩qMin后面要-2了，也许是为了passage做打算。

我有个不错的打算，可以让开始菜单是个特殊的地图，让菜单里面选项作为box，可以被player撞击选中，也可以鼠标点击完成。

行和列不要弄反了，例如之前i和j全都是反的，主要是绘制地图部分，现在发现spactPath也是反的，需要改
```
    this->leftSpaceWeight = qMax(0, (sizeWidth - boxWidth * boxCol) / 2);
    this->leftSpaceHeight = qMax(0, (sizeHeight - boxHeight * boxRow) / 2);
```

妈的，overji写的放缩计算有问题，2种计算是不匹配的。

我现在是相当不理解为什么要弄displayLen，只需要对800x600的情况放缩就好了，但是话说回来，这个displaylen好像是我写的，那就怪不得别人了，纯粹是我傻逼了。

到目前为止（16点16分），应该来讲step1已经完成了，接下来是step2
- 创建可移动的小人
- 小人与箱子的交互


#### [[2025-06-26]]

妈的，析构函数是不是没写，考虑把player写完之后再统一写

```
QLinkGame.cpp:12:19: Allocating an object of abstract class type 'GameMap'
qgraphicsitem.h:269:20: unimplemented pure virtual method 'boundingRect' in 'GameMap'
qgraphicsitem.h:289:18: unimplemented pure virtual method 'paint' in 'GameMap'
```

想了一下，发现player的draw函数自己实现就可以了，至于resize函数等一系列event还是需要在QlinkGame.h里面实现，就是加进去

整了个CommonDefinition.h，把常数全部放里面，然后要用到常数的文件都include一下

对于player的尺寸，考虑以box尺寸为基础放缩，比例系数暂且设置为0.7

考虑在player里面写个函数检测是不是碰撞到边界了，但是好像这样4条边的判定方式不一样，那还不如分别写入4个goXX函数

`event->key()`的类型是int

玩家的x,y坐标也需要被resize

密码的，好像现在player没法被键盘事件触发，这个好像要单独设置还是怎样。

我感觉还是让player一直走比较好，现在更新坐标后不会触发paintevent，需要手动update()，overji也是用的一直走

妈的，他不是一直走，但是他也没update，我怀疑他是在按下时触发方向，这个时候会一直走，然后抬起时触发方向5，于是停下来，好高级的做法。

```
//玩家向下移动
    if ((playerLeftTopY + playerHeight) <= 600) {
        playerLeftTopY += playerSpeed;
    }
```

这个之后才检测是否碰撞，说明不是实时移动的，是整体判断完后才移动

我感觉要看看overji的qtimer的用法，也许他是每个时间周期都刷新一次。

还真的是
```
void LinkGame::initTimers(const int &remainTimeInput)
{
    //初始化计时器，remainTimeInput:剩余时间
    QTimer *gameFlashTimer = new QTimer(this);
    //将计时器的超时事件与LinkGame的update函数绑定，即一旦计时器时间到了，就会调用一次update函数
    connect(gameFlashTimer, &QTimer::timeout, this, QOverload<>::of(&LinkGame::update));
    gameFps = 60;
    int gameFlashMs = 1000 / gameFps; //每秒刷新gameFps次
    gameFlashTimer->start(gameFlashMs); //计时器开始计时
```
这样子就会定期update

`gameFlashTimer` 的工作流程如下：

1. **触发计时器**:
    - 每隔 16.67 毫秒（或每秒 60 次）触发一次 `timeout` 信号。
2. **调用 `update` 方法**:
    - `timeout` 信号触发后，调用 `LinkGame::update` 方法。
3. **调用 `paintEvent` 方法**:
    - `update` 方法通知 Qt 需要重绘界面，从而触发 `paintEvent`。
4. **更新游戏逻辑与绘制界面**:
    - 在 `paintEvent` 中调用 `gameUpdate` 更新游戏逻辑，并通过 `QPainter` 绘制游戏界面。

通过这种机制，`gameFlashTimer` 保证了游戏界面以 60 FPS 的帧率流畅运行，同时保持游戏逻辑的实时性。

#### [[2025-06-27]]
`QOverload` 是一个帮助类，用来显式指定信号或槽函数的重载版本，避免歧义。它常见的用法是通过 `QOverload<>::of` 来选择具体的函数版本。
`connect(gameFlashTimer, &QTimer::timeout,this,QOverload<>::of(&QLinkGame::update));`

已经引入gameUpdateTimer，现在注释掉keypressevent里面的update也可以操作了

既然人物移动已经实现的差不多了，接下来就应该实现箱子选中与检测，

#### [[2025-06-30]]
[SJTU-SE-SEP2024/QLink/Player.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/Player.cpp)

我觉得应该换个思路，让人物的步长是一个box的宽度，speed调节的是几个格子

这个不好，这样就没法调节速度了。看了看overji的代码，他计算了玩家当前位置对应抽象行列的位置，然后只检测对应一行/一列上的box，最外侧的如果撞到了，那就执行后续操作。这个是好的。

在player里面整个map指针，这样方便访问map里面各种参数

[SJTU-SE-SEP2024/QLink/Player.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/Player.cpp#L245)

20点48分 太好了，fix 了一系列bug，现在up的碰撞正常了。现在要解决绘图的bug

此外，窗口放缩后人物位置也要变，但是我觉得这个实现起来比较麻烦，考虑问一下助教需不需要实现这个。

在up里面设置box状态后立马设置box颜色，现在从左侧撞击是可以改变颜色的，但是从右侧不可以，奇了怪了，明明右侧撞击是检测到了的。

好极了，看来现在是只能检测到左侧的撞击，不能检测到右边的。如果左侧为空而右侧有箱子，玩家不能向上。

啊卧槽我知道了，虽然那个地方看起来没有箱子，但是实际上是有的，只是没画出来，看来要提前引入removed状态了。

我靠，既然画出来最上面最下面可能是空白的话，那么就不能简单地使用upGo里面的2个if了，毕竟最上面最下面不一定是存在的

现在底部格子右边撞也可以了，但是内部的格子没法向上撞，会被转移到底层格子下面，怀疑是没撞到内部上面的，但是检测机制检测到玩家在某个格子上面，判定为已经大大越界了，于是就被移动回去了。于是加了这么一个条件
`(gameMap->getMap())[i][rightCol]->getLeftTopY() <= tmpY`
这样就精确判定撞到某个格子里面去了

那么，把这些函数迁移到其他方向移动是不困难的，大体可以宣布step 2完成了。21点25分

刚才又优化了些小细节，同时把debug用的输出去掉了

23点29分 完成了4个方向的碰撞检测。考虑把选中的方块edge加粗, function added

#### [[2025-07-01]]
[SJTU-SE-SEP2024/QLink/SelectChecker.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/SelectChecker.cpp)

pathline里面的点是在selectchecker里面被添加到vector里面的

>消除：如果此次激活的⽅块和上次激活的⽅块是同种类，且可以通过两次以内的折线连接

那么一次也可以，两次也可以

我靠，感觉selectchecker有点难搞，首先要克服的问题是那个折线究竟怎样是合法的

#### [[2025-07-03]]
我觉得画线时，点可以从box中间开始，这样不用考虑从盒子上方还是下方射出的问题

```
bool SelectChecker::checkLine(LinkGame *game, Player *player, int direction, int start, int end,int anotherLocation)
{
    //检查路径是否可行，没有障碍存在
    //应当注意start和end传入的是画面的坐标，相对应与800,600
    //dirction为1时是横线，y大小不变
    //dirction为2时是竖线，x大小不变
    //anotherLocation是大小不变的那个变量
```

感觉我实现时，没必要整个方向参数，统一用2个点4参数

考虑selectChecker，在玩家类里面定义一个，不要像overji一样SelectShceker::...什么函数，感觉还是整一个统一的对象来实现这些函数的调用，虽然selectChecker也只是进行一些校验和更新，没有存贮什么东西，但是还是整一个统一的对象比较好。

```
void SelectChecker::checkSelected(LinkGame *game, Player *player)
{
    //检查目前选中的箱子是否已经不存在，如果不存在，就在选择中去除这个箱子
```
我对于这个函数不是很理解，但是为了鲁棒性，还是写进去比较好。

注意到这个要求
>原则上每个函数不超过 50 ⾏

我感觉也无所谓，首先是“原则上”，其次也没人禁止我压行，这些倒是也无所谓，我们要考虑的首先是把功能实现了，然后才是优化与美化。

妈的，我现在怀疑overji用了checkselected，就是因为他写移动碰撞判定的函数里面的判定，没有特别判定box是否存在。

##### 检查是否有循环依赖

如果 `SelectChecker.h` 也包含了 `Player.h`，就会出现循环依赖。此时两个头文件互相依赖，编译器就无法知道类型定义。

**解决办法**：在头文件里用前向声明，只在 cpp 文件里包含对方的头文件。

```
D:\my_programs\SEP_Assignment\QLink_project_qhx\SelectChecker.cpp:22:12: Don't call QList::operator[]() on temporary [clazy-detaching-temporary]
```


#### [[2025-07-08]]
```
消除：如果此次激活的⽅块和上次激活的⽅块是同种类，且可以通过两次以内的折线连接，则该两个⽅块被消除，玩家获得分数。（请绘制出将两个⽅块连接在⼀起的折线）
```
既然是这样，那么似乎不用绘制出玩家的路径，只需要绘制选中的2个方块之间连起来的线就可以了。

好嘛，我又遇到了互相依赖的问题，copilot是这样说的：

---
##### 双向依赖问题
我有2个类的定义，它们互相需要调用对方内部的函数，我要如何操作？我有个player.h，以及一个select.h，我在player类里面定义了一个select对象，而player的函数实现里需要用到select的函数，select里面也需要player的函数

这是C++经典的**双向依赖**（cyclic dependency）问题。两个类互相调用对方成员函数时，常规做法如下：

###### 1. 前向声明 + 指针/引用成员

- 在A类定义前，前向声明B类（`class B;`），A类只用B类的指针或引用。
- 在B类定义前，前向声明A类（`class A;`），B类只用A类的指针或引用。

###### 2. 在cpp文件中包含对方的头文件

- 在头文件（.h）里只做前向声明。
- 在实现文件（.cpp）里包含对方的完整头文件，这样可以调用成员函数。

---
注意到现在选中2个盒子并消除时，第二个被选中的盒子的边缘选中并不会被显示，需要引入延迟，也许在画完线之后延迟个几百毫秒再消除。

刚才重构了下，把color存储在box类内部了，不需要每次根据type从color数组里面读取，此外感觉type=0和isremoved=true虽然是一个意思，但是如果一个盒子是后期被删除的，那么最好还是动isRemoved，毕竟如果要恢复的话，还是存储着之前的type比较好

现在是选中2个盒子，无论是否符合条件，都可以删除，当然这个是测试逻辑，还是很不错的。

啊卧槽，我忘记我干这一切的目的了，差点就摸鱼去了，我是要测试col和row计算正不正确啊焯
他妈的，果然不正确，简直就是有问题，妈的，怎么会有问题呢，我不理解，妈的

嗷太好了，是小问题，妈的，之前横着我的判定是x1=x2，我是baka，修改完之后就好了，而且我的格子是从0开始编号的，所以算出来好极了。

#### [[2025-07-21]]
又开始干活了嗷

`boxMap[i][j]->getBoxType() == 0 || boxMap[i][j]->isBoxRemoved()`判断盒子不存在

需要考虑下，画线的装点的容器和函数实现在哪里，怎么写

他妈的，checkline里面i没有换算成行列数

格子是15x20的，那么在判断双折线，doubleLine时，可能线会出现在格子区域以外，也就是小于0或者大于格子行列数目，这种情况可以考虑特判，先判断这样行不行，然后可以确定是否在各自区域以内，从而for循环正常，不会导致数组越界

他妈的，x1,y1,x2,y2都他妈的是真实坐标，还没换算成行列坐标

01折线可以根据原有坐标推算出折点，可以在checkRemoveAble函数里面或者在checkPathType里面添加到绘图序列里面，但是二折线不好搞

画线绑定在人物上，作为一个函数
在qlinkgame里面，player的draw后面紧接着调用画线

我觉得还是需要窗口大小固定，我不能什么都写一个resizeevent，太麻烦了，而且也没要求可resize

意识到，singleline和doubleline判断时，checkline两端的格子是不会判断的，但是折线的折点处可能会有箱子，这个需要专门写函数判断

最顶上一行的12折判断有问题

#### [[2025-07-23]]
`painter.drawText(boxRect, Qt::AlignCenter, QString::number(boxType));`把格子的类型画出来，方便debug

```
x y= 15 0
into exist case 1
15 15 0 20

    if(i < 0 || j < 0 || i >= boxRow || j >= boxCol)
    {
        std::cout<<"into exist case 1"<<std::endl;
        std::cout<<i<<" "<<boxRow<<" "<<j<<" "<<boxCol<<std::endl;
        return false;   //需要是>=而非>，毕竟从0开始，末位没写入
    }
```

妈的，看来是纵横弄反了

好吧，现在至少解决画线穿过type非0格子问题了，问题的关键还是在于行列，妈的
ij是行和列，于是应该==分别对应y和x，而非xy！==

后来统一重构为传入x和y

但是boxMap的编码是行和列，这样的话还是统一传入行和列，也就是i和j好了

还是不要resize event好了

认为第一行问题出在取整上，假如说位置-21除高度33，int是0，但是实际上应该要是-1才对，21除33是0，确实是第一行，也就是y=0

涉及坐标轴换算，从屏幕左上角00坐标轴到box区域左上角00坐标轴

`int endCol = integerDiv(end - gameMap->getPathWidth(), gameMap->getBoxWidth() );`要换算成box坐标，就需要减去path尺寸再计算

这样一来，最顶端画线问题就解决了，可以正常画线，很好，另外3边也可以

那么checker逻辑应该是全部初步实现了，需要进一步考虑的是
- 边界条件判定
- 画线逻辑优化
	- 寻线可否剪枝
	- 从边缘开始寻，画出来的线并非沿着箱子边缘，建立一个栈，使用最后找到的可行的一对点（也就是最贴合箱子边缘的点，检测到下一个坐标不可行时，就break，返回栈顶的点）
- 画图优化
	- 选中盒子可以消除
		- 盒子和连线先共存几秒，然后一起消除
		- 文字提示可以消除，不可消除等


注意到[[俞冠廷]]说：
感觉还是画格子比较好使 走一格刷新一下 只用计算坐标就行 不用管碰撞检测

日，感觉他这个思路好方便。他妈的，早知道还是不参考学长代码比较好，我应该一开始就划分屏幕区域，然后基于划分的方格作为基本地图和坐标，进行以后的操作

紧接着要做的
- 输出判定结果，显示到界⾯上
- 每次⽅块消除后，都要判断当前地图是否可解，若⽆解则显示在界⾯上，并使得游戏结束

通过`setFixedSize(DEFAULT_WIDTH,DEFAULT_HEIGHT);`，设置了固定尺寸

认为盒子和线需要延时消失，说明文字也是，这种延时怎么实现需要学习

>我希望在我的qt程序里添加功能，在窗口内绘制文本，文本内容取决于某个变量a，一般情况下文本展示3秒后消失，但是当变量a变化时，文本内容也要相应变化，同时展示时间顺延3秒，我要如何操作

计时器可以不止一个，不然我也不会写inittimer==s==

#### [[2025-07-24]]
目前，player->clearCurrentSelected();立即执行，而selectChecker->removeTwoBox(gameMap, this);延迟执行，考虑创建tmpSelect以供使用，或者每次只显示一个，下次选中时发现还没清空，就终止计时，设置为false

基本上实现了计时器，但是还是有一些小bug，比方说选中2个可消除的之后，马上再选择其中一个，会导致意想不到的后果，但是只要操作不快，应该不会触发，所以一方面要避免这种情况，一方面也要适当缩短展示时间

对这种情况做了特判，现在基本可以正常运行了，换言之，整个程序的核心逻辑——选中删除逻辑已经完成了。

为了减少一个函数的行数，可以将3选中状态封装成一个函数

下一步是实现
>每次⽅块消除后，都要判断当前地图是否可解，若⽆解则显示在界⾯上，并使得游戏结束

原来无解指的是没有任何一组解，换言之，只要存在2个方块可以消除就好了

我想测试结束画面，但是这个需要消除所有能配对的方块，而且注意到貌似判定有点问题，我需要手动构造地图

endofgame在消除格子后判断，但是从选中连线到删除，并不是一个过程，假如在判断2个盒子可以消除后马上判断endofgame，由于延时删除的原因，此时被选中将要删除的盒子实际上没有被删除，于是判定过程里面这个盒子是存在的，但是当它被删除时，并没有再进行判断。

所以要
```cpp
void Player::finishTextPrint()
{
    printTextStatus = false;
    if(removeTwoBox) selectChecker->removeTwoBox(gameMap, this);
    clearLinePath();
    clearCurrentSelected();
    selectChecker->mapSolvable(gameMap,this);
    std::cout<<"finish text print"<<std::endl;
}
```

得益于手动设置了地图格子分布
```cpp
    for(int i=0;i<boxRow;i++)
        for(int j=0;j<boxCol;j++)
            boxMap[i][j]->setBoxType(0);

    boxMap[1][1]->setBoxType(1);
    boxMap[1][1]->setBoxColor(color[1]);
    boxMap[2][1]->setBoxType(1);
    boxMap[2][1]->setBoxColor(color[1]);

    boxMap[2][2]->setBoxType(2);
    boxMap[2][2]->setBoxColor(color[2]);

    boxMap[3][3]->setBoxType(3);
    boxMap[3][3]->setBoxColor(color[3]);

    boxMap[4][4]->setBoxType(1);
    boxMap[4][4]->setBoxColor(color[1]);
```
endofgame的调试十分方便。

22点48分 step3基本完成

#### [[2025-07-25]]

在cpp qt中，我希望在窗口上方居中显示倒计时，单位为秒，我已知窗口尺寸，我要如何操作

初步实现了计时器，位置和尺寸有待优化，10点07分 初步完成step4

定义一个一维item容器，每次根据行列坐标查询到对应的item，查询函数在gamemap里面

item虽为箱子，还是设置为不存在比较好，采取判断是否存在的isboxexist中添加type=4条件，如果通过设置isremoved，碰撞判断可能有点问题
毕竟碰撞逻辑检测包含`!(gameMap->getMap())[i][leftCol]->isBoxRemoved()`

设置完item消除后，不要忘记给它对应的box矩阵也设置消除，不然碰撞检测还是会撞到。

注意到实现完item碰撞逻辑后，撞击普通方块程序会崩溃，但是绘制地图时通过getItem函数就没问题。问题出在绘制地图时type=4，那么getItem肯定能找到，不会遍历到item存了数据以外的下标。但是碰撞检测时，既然撞不到，那么也就没有对应的item，我现在只设置了5个箱子，那么检查会到5以外的下标，这部分没有定义。看来需要init时就先赋值0或者-1占位

先全部赋值nullptr，然后遍历时null就跳过，这样还是有问题，没想到是调试信息
`std::cout<<"item "<<tmpItem->getItemRow()<<" "<<tmpItem->getItemCol()<<std::endl;
出问题了，毕竟null是获取不到信息的，删除了就好了

目前初步完成step5的part1 22点24分 

刚才终于成功通关一把了，剩余大概80s，过程感觉还是比较惊险。

接下来是实现Shuffle和hint，然后暂停和保存系统，然后是主界面，再双人模式，后2者和文档不一样，但是我觉得这样比较好，我希望有个入口可以设定单人or双人

#### [[2025-07-27]]
行和列随机数组，二重循环，构造15x20=300个点，存入QPair数组，然后依次取2个交换

我感觉交换逻辑有问题，至少目前写的
`void GameMap::swapBox(int x1,int y1,int x2,int y2)`
有很大的问题，比方说坐标交换绝对是有问题的，也许我只需要交换指针指向就可以了，也许交换指向之后我目前写的部分才有意义。需要思考。
册那，应该先指针交换，然后写类似于`boxMap[x1][y1]->setBoxXY(x1,y1)`这种看似废话的东西。
嗷，其实不用，因为交换后，x2,y2对应的`*box`才是这个位置上应该有的，不对，位置需要改，颜色不需要，不对，只有位置需要改。

貌似交换指针是所有交换操作共有的，可以考虑写在GameMap::swapBox的前面

#### [[2025-07-28]]
认为空箱子和箱子没有本质区别，所以不用分开写交换null和box的

shuffle之后item容器里面不一定前5个都是type0，顺序可能会变，所以要全部遍历来获取某个type

重排后要让人物回到00，否则可能重叠。这个在item里面实现

如果是按照顺序挨个swap，前面已经swap的可能会被再次swap

册那，判断盒子是否存在我用的是
`bool isBoxExist() const {return boxType != 0 && !isRemoved && boxType != 4;}`
换言之，道具被排除了，所以会有问题

于是整了
`bool isBoxOrItemijExist(int i, int j) const;`

然后，首先把代码喂给copilot，发现有个spot2写成spot1了，改正后，还是有问题，道具可以被绘制但无法碰撞检测，认为绘图用的lefttop和逻辑用的rowcol不一致，检查发现前面盒子换了一次，后面命名又换了一次，导致实际上其中一个没变而另一个变了，修正后shuffle功能正常。

接下来考虑hint功能
hint用到selectchecker的mapSolvable功能，所以item takeeffect函数用到player指向selectchecker某个函数，不过也要带上map指针。我觉得难点在于要不断找到下一个，直到消除

感觉hint盒子的获取还是写在map类里面比较好

考虑建立一个hint box vector，每次被消除后就清空，通过判断是否为empty判断是否补充新的一对盒子

如果gamemap的hint用不到player里面的函数，可以考虑删掉map里面定义的player

shuffle之前，要清空hint，也要清空选中

21点32分 已经初步实现step5，当然，没有实现flash，反正只要求实现其中一个 

把`#define TEXT_DISPLAY_TIME 250`时间调短一点，有效缓解多次重复选择问题

#### [[2025-07-29]]
实现了暂停功能，这个还挺简单的，接下来是实现存档，这个涉及到文件输出和读入，可能有点困难，需要学习

认为需要在暂停后才考虑绘制保存按钮，然后才能保存，然后咱马上基于此绘制开始界面

我觉得可以优化下结束判断逻辑，假如说还有shuffle道具的话，那么原本无解的地图可能有解

“M和N可以⾃定义”，那么需要我后期做完主窗口后实现，也需要写入存档

测试了下，修改箱子行列个数没什么大问题，但是移动速度也要相应修改，不然会有点慢。考虑以15x20的速度作为标杆

需要写入存档的
- 地图


#### [[2025-07-30]]

关于存储数据的小妙招：

你的疑问非常好，总结一下就是：

- 写入时，多个数据（int、double、bool等）通过 QDataStream 连续写进了一个文件，没有分隔符，数据是“连在一起”的。
- 读取时，为什么可以“直接一项一项”地读出来，还能恢复成原本的内容？

#### 关键点：QDataStream 的序列化与反序列化

QDataStream 是 Qt 提供的二进制流工具，它自动帮你处理了**数据类型的边界和顺序**问题。

##### 1. 顺序写入，顺序读取

- 你写入的顺序（比如：int、int、int、double、bool……）和读取的顺序一模一样。
- 只要你按照当初写入的类型和顺序来读取，QDataStream 就会把相应的数据还原出来。

#### 2. QDataStream 如何区分每一项？

- QDataStream 在写入时，会把各种基本类型（int、double、bool等）转换成固定字节数的二进制数据，按照顺序一个接一个地写到文件里。
- 读取时，它知道每个类型占多少字节（比如 int 4 字节，double 8 字节等），所以每次 in >> tempInt; 就会读“下一个”4 字节，并还原成 int。
- 只要写入和读取的顺序、类型完全一致，QDataStream 就能自动帮你区分每一项，**不需要任何分隔符**。

#### 注意点

- **顺序和类型必须一致**。如果顺序不对，类型错位，读取的数据就会错乱。
- 如果你写入了更复杂的数据结构（比如 QString、QPixmap），QDataStream 也会用自己的方式编码/解码，但还是需要写入和读取顺序、类型完全对应。

---

**总结：**

- 数据确实是“连在一起”的（二进制连续存储）。
- 只要写入和读取顺序、类型一致，QDataStream 能自动正确分割和还原每一项。
- 这就是你直接 in >> tempInt; 一项一项读出没问题的原因。


关于 auto i : xxx的警告
你遇到的警告：

Code

```
c++11 range-loop might detach Qt container (QList) [clazy-range-loop-detach]
for(auto i : items)
```

这是 Clazy 静态分析工具给出的警告，意思是：

**你的代码可能会导致 QList（或其他 Qt 容器）发生深拷贝（detach），从而带来性能问题或行为异常。**

原因说明

在 Qt 的容器（如 QList、QVector 等）中，如果你用 `for(auto i : items)` 这种写法，会**拷贝每个元素**。  
如果元素是 `QSharedPointer`、`QWidget*` 这类指针，问题不大；  
但如果元素是自定义类、QString等较重对象，或者元素是容器自己的引用（如 `for(auto x : list)` 中 x 还是 list 里的元素），就可能导致 Qt 容器的“写时拷贝”机制触发，产生不必要的拷贝（detach）。

推荐做法
1. 使用引用遍历（推荐，几乎总是安全高效）

改成：

C++

```
for (const auto& i : items) {
    // 只读访问 i
}
```

如果你需要修改元素：

C++

```
for (auto& i : items) {
    // 修改 i
}
```


什么时候需要用 `GameMap *&gameMap`？
只有当你希望在 `loadGame` 里**让外部指针指向新的对象**（比如 `gameMap = new GameMap;`），才需要用 `GameMap *&gameMap`。

总结

- **只想把数据填进已分配对象**：用 `GameMap *gameMap`
- **要让外部指针指向新对象**：用 `GameMap *&gameMap`

你的场景，只需用 `GameMap *gameMap` 即可！

该说不说，编写savesystem的过程让我好好整理了下各个头文件里面的函数，关联性高的放在一起，一些实现不合理的顺手改一下

18点18分 从理论上讲，初步实现了saveSystem的函数，但是没有添加到游戏流程中，也没有debug，考虑先把保存按钮，主界面做了再说。

他妈的，既然各种paintevent都实现在qlinkgame类里，那么考虑pages类作为qlinkgame类的一个附属，统一在qlinkgame里面的paintevent实现界面切换

我现在已经在某个类（qlinkgame）里面实现了paintevent等各种event，但是我有了新的需求，我希望程序开始运行时，能先显示一个主界面，我定义了一个新的类pages，我希望main.cpp能先通过pages画出主界面，然后主界面上按下按钮后进入qlinkgame，那么我的paintevent应该在哪里实现呢

drawPausePage可以作为qlinkgame里面的一个函数，而没有必要作为一个单独的类

我有个pages类：

class Pages : QWidget
{
public:
    Pages();
    
private:
    QStackedLayout *stackLayout; //页面切换管理
    QWidget *mainPage;
    QWidget *gamePage;
    QWidget *gameSetPage;
    
    void initMainPage();
    void initGamePage();
    void initGameSetPage();
};


我也定义过：
class QLinkGame : public QWidget
{
public:
    QLinkGame(const int &row,const int &col, QWidget *parent);
    ~QLinkGame();

    GameMap* getMap() const {return gameMap;}

private:

    GameMap *gameMap;
    Player *player1;
    QTimer *gameUpdateTimer; //界面update计时器
    int flashMs = 1000 / GAME_FPS; //每flashMs刷新一次

    void paintEvent(QPaintEvent *event) override; //paint event
    //void resizeEvent(QResizeEvent *event) override; //resize event
    void keyPressEvent(QKeyEvent * event) override; //key press event

    void initTimers();

    void saveGame();

};


我可不可以addWidget(QLinkGame)

**可以！你完全可以把 `QLinkGame` 的实例通过 `addWidget()` 添加到你的 `QStackedLayout` 里。**

---

## 详细解释

### 1. 继承关系

- `QLinkGame` 是继承自 `QWidget` 的自定义类。
- `QStackedLayout::addWidget()` 的参数类型是 `QWidget*`。
- 所以你可以直接把 `QLinkGame*` 当作参数传递。


初步测试了可行性，发现确实可以，很好

#### [[2025-07-31]]
```
#include <QVBoxLayout>
```

void SaveSystem::loadGame(QLinkGame *game)

不能先new一个空白的gamemap再读入，这样的话gamemap的boxmap没有初始化，无法被赋值，


1520333170670450010
1520333170670450010

basic info ok

00 29 27 5 0 0 255
00 29 27 5 0 0 1

0029275000
0029275000

00
00

1520333170670450010

002927500000

1520333170670450010
load basic data ok
002927500000
load player data ok

0 70 67 33 31 101000
0 103 673331101001
0 136 673331101002

0 0 0 70 67 33 11 02763264256
0 0 0 1036733111148099840256
0 1 0 1366733111602400512256

去掉player输入后
0 70 673331101000
0 103 673331101001
0 136 673331101002

看来问题在player

刚才试了试注释掉player里面两个vector的读写，然后启用box读入，注释掉剩余内容，box读取正常了，看来问题在于player里面的读写，也许我不应该用auto

一路顺藤摸瓜排查问题，认为item获取问题

现在保存和加载大体上没什么问题了（20点58分），但是currentselect有点问题，就是箱子边框是黄的，但是箱子本身没有被选择，而且箱子边框粗细也没变

其实不是大问题，其实是选中了的，只是load box时忘记加上`box->setBoxEdgeLen();`了

可以考虑把map里面drawendpage删了，也可以全部注释掉，做个纪念

我刚才试玩时，注意到连线可以穿过道具，这是不行的
他妈的，这个小问题居然还困扰了我一会，我本来以为checkline里面isboxexist改成isBoxOrItemExist就可以了，结果还是会穿过，尝试调试checkline，发现它知道9 19是个item，后来才意识到，这个可能不是0折线，而是2折线，只不过刚好是直的，那么问题出在checkTurnPoint用的还是isBoxExist，然后修改后就解决了。

21点39分 经过测试，保存系统和界面都大体完成了，这是好的，现在只剩下step7双人模式，以及单元测试没有编写

此外，值得一提的是，qt creator 就是一坨狗屎，太难用了，超级卡，用vscode编辑就很丝滑，至少我感觉很爽，用qc就像是便秘了一样

接下来要做的
- gameSetPage，可以编辑row和col ==done==
- 双人模式
- 单元测试

- Qt 的**父子对象机制**会保证：只要 `gameSetPage` 被 delete，它里面所有的子控件（比如 editRow、editCol）会自动被销毁。
- 你**又手动 delete 了 editRow、editCol**。这样 Qt 会 double free（重复释放）这些控件，导致程序崩溃！


做了一些乱七八糟小小的逻辑上的界面上的优化

#### [[2025-08-01]]

认为至少注释真得用vscode来写，qc太卡了，不知道一天到晚在检测些什么东西，关键还不好用，妈的。

10点02分 单双人界面选择和游玩测试大体完成，可以认为大体完成project1的主体部分编写！

剩余步骤
- 优化
	- 按键
	- 绘图
- 单元测试编写

道具有2重身份
- type=4的箱子
- items容器里的item
二者相互对应


有些传入参数里面可以const的需要加上，等到代码规整化做完后，再开始编写单元测试

selectchecker的逻辑

[SJTU-SE-SEP2024/QLink/SimpleTest.cpp at main · overji/SJTU-SE-SEP2024](https://github.com/overji/SJTU-SE-SEP2024/blob/main/QLink/SimpleTest.cpp)

#### [[2025-08-02]]

qc就是一坨屎，他妈的cmakelist你妈的添加单元测试根本没有教程，你妈的我真的是服了，重新构建了个项目，采用qmake，希望能成

他妈的，我直接把之前写好的.h和.cpp文件复制过去还不行，.pro文件不认，还需要我手动一个个新建类，然后把之前写的复制过去，这个过程中qt多次卡死，妈的。不过令人欣慰的是，问题解决了，而且貌似采用qmake构建会比cmake快一些，卡死的情况也少了很多。

通过这个教程：
[(64 封私信 / 81 条消息) QTest单元测试框架，简单，好用，高效 - 知乎](https://zhuanlan.zhihu.com/p/39376945)
主要是
直接打开SimpleTest工程，在pro文件中添加testlib模块  
QT += core **testlib**
以及
将main函数修改为：

```cpp
#include "commoditytest.h"
QTEST_MAIN(CommodityTest)
```

然后就可以开始单元测试了


23点04分 初步编写完了基本的单元测试，一些极限情况还没写，例如盒子区域以外（边缘区域）的单元测试，但是总体而言，project1基本上是做完了

``` shell
********* Start testing of SimpleTest *********
Config: Using QtTest library 6.9.0, Qt 6.9.0 (x86_64-little_endian-llp64 shared (dynamic) release build; by GCC 13.1.0), windows 11
PASS   : SimpleTest::initTestCase()
PASS   : SimpleTest::fourSelectDealTest()
PASS   : SimpleTest::tripleSelectDealSameTest()
PASS   : SimpleTest::tripleSelectDealNotSameTest()
PASS   : SimpleTest::selectSameTest()
PASS   : SimpleTest::selectSameNotSameTest()
PASS   : SimpleTest::zeroTwistCanRemoveRowTest()
PASS   : SimpleTest::zeroTwistCannotRemoveRowTest()
PASS   : SimpleTest::zeroTwistCanRemoveColTest()
PASS   : SimpleTest::zeroTwistCannotRemoveColTest()
PASS   : SimpleTest::oneTwistCanRemoveLeftTest()
PASS   : SimpleTest::oneTwistCanRemoveRightTest()
PASS   : SimpleTest::oneTwistCannotRemoveNormalTest()
PASS   : SimpleTest::oneTwistCannotRemoveCornerTest()
PASS   : SimpleTest::doubleTwistCanRemoveCase1Test()
PASS   : SimpleTest::doubleTwistCanRemoveCase2Test()
PASS   : SimpleTest::doubleTwistCannotRemoveCase1NormalTest()
PASS   : SimpleTest::doubleTwistCannotRemoveCase1CornerTest()
PASS   : SimpleTest::doubleTwistCannotRemoveCase2NormalTest()
PASS   : SimpleTest::doubleTwistCannotRemoveCase2CornerTest()
PASS   : SimpleTest::mapCanSolveTest()
PASS   : SimpleTest::mapCannotSolveTest()
PASS   : SimpleTest::canGetHintBoxTest()
PASS   : SimpleTest::cannotGetHintBoxTest()
PASS   : SimpleTest::cleanupTestCase()
Totals: 25 passed, 0 failed, 0 skipped, 0 blacklisted, 6ms
********* Finished testing of SimpleTest *********
```

#### [[2025-08-03]]
完善了下单元测试，接下来考虑
- 美化游戏，设置一些图片，配乐什么的
- 鉴于有26个警告，注意到是因为有些传入的参数没有被用到，可以考虑从定义里面删掉，但是同时很多调用这些函数的地方也需要修改
- 有些变量的作用是一样的，例如我记得有2个判断现在的2个盒子是不是要消除的变量，考虑统一；此外，有些函数的实现可以优化

密码的，才注意到+1s是加30s

而且，册那"Hint： 10s 内会⾼亮⼀对可能链接的⽅块，被消除后会⾼亮下⼀对，直到 10s 时间结束"。居然还有10s的限制，看来又得引入一个计时器，而且还需要再次修改保存系统。

此外，“两个玩家的两个⻆⾊在相同的地图上进⾏游戏，以结束游戏时双⽅的分数决定谁为赢家”，还需要统计分数，妈的

很好，现在这些需求都做完了

册那，还有“并随机玩家⻆⾊位置”，密码的，考虑取个巧，只在外面一圈生成玩家，我不想再写个检测玩家所在位置是否合法的函数了

>cpp qt中，我想让玩家在地图中随机生成位置，但是有所要求：玩家位置不能生成在窗口内部一个矩形中，已知窗口尺寸，窗口边缘到矩形边缘的距离。此外，玩家是个矩形，已知其尺寸，需要获取随即后的左上角xy坐标

再加一点小小的改进，把几号玩家打印在玩家矩形中央

22点54分 测试了一下，基本符合需求，之前的是初版，这次应该是完成了所有需求了。

此外，有些大于50行的函数也许可以拆分一下。

#### [[2025-08-07]]
可以稳定复现：触发多次type1后，再触发type2，会越界

1. **循环中的下标错误**
    
    - 在 drawMap 的 hintBox 检查部分有如下代码：
        
        C++
        
        ```
        for(int k = 0; i < hintBox.size();k++)
            if(hintBox[k] && !hintBox[k]->isBoxRemoved()) formerHintNum++;
        ```
        
    - 这里循环条件写错了，应为 `k < hintBox.size()`，你写成了 `i < hintBox.size()`，导致死循环并越界！
    - 正确写法应为：
        
        C++
        
        ```
        for(int k = 0; k < hintBox.size(); k++)
        ```

他妈的，原来问题在这个地方

后面测试就正常了

#### [[2025-08-09]]

切换到mvsc，visual studio开发

参照这个：
[(66 封私信 / 81 条消息) Qt6.8.1下载错误+Error transferring+server replied: Forbidden - 知乎](https://zhuanlan.zhihu.com/p/15048768529)
换了ustc源

[VS2022配置Qt6.9环境-CSDN博客](https://blog.csdn.net/qq_53222291/article/details/149943435)

很好，12点56分，用vc编译通过跑起来了，第一次提示找不到qt6widget.dll，后来参照[“由于找不到Qtxxxx.dll,无法继续执行代码”问题的解决_由于找不到qt6cored.dll,无法继续执行代码-CSDN博客](https://blog.csdn.net/weixin_43455581/article/details/105903082)，添加了环境变量，然后重启，第一次还是跑不起来，后来尝试发现要把“选择启动项”切换到这个项目对应的启动项才可以。

我觉得以后应该编写2个人选中同一个箱子后，冲突判断问题
参见[[2508实习（存疑） - pyQt]]，在py之后完成了编写。该说不说，vs确实比qc好用多了

#### [[2025-08-10]]
参见[如何更改 Visual Studio 字体以提升编程体验-CSDN博客](https://blog.csdn.net/whitefish_/article/details/144769237)，更换了jetbrains mono regular字体，看上去至少比宋体要好多了

使用vs完全依赖copilot添加了详细的注释，测试了下也能跑，已经push了。不得不说，vs做得是真的好，注释写完了点击应用，会模拟真实修改一样逐行修改，最后每个被修改过的区域会一一被展示，并让我决定是否保留，一路按tab就行了。

#### [[2025-08-21]]

基本上把py的paintRemove和set of event.key()加上去了，但是现在新的问题出现了：双玩家高频操作下，会有箱子isRemove了但是没有paintRemove，看了看，怀疑是这个问题:
>我觉得以后应该编写2个人选中同一个箱子后，冲突判断问题

这个还没有在cpp版本里实现。

player里面：conflictDeal
gameMap里面twoPlayerConflictDeal
这个在player的finishTextPrint里面调用

我觉得还不如在碰撞检测里面加一个选中前，如果这个箱子已经被选中了，那么就无法选中这么个操作，但是这会不会导致一个玩家重复选择一个箱子时出问题呢？可以试试。
好吧，这样确实有问题，选中一个后，它就无法被判定碰撞了，可以被穿过，妈的

妈的，原来是[[2508实习（存疑） - pyQt]]的deal有问题，为什么这个不是在selectchecker判定可以消除后立刻进行，而是在finishtextprint里面执行，我不是很理解

很奇怪，在finishtetxprint里面写twoPlayerConflictDeal就可以了，在selectchecker里面操作反而不行，我猜测可能因为设置了某些箱子为isRemove，然后又把它从列表里面删掉了，所以paintremove就管不到它，就成了幽灵箱子。但是问题差不多是解决了，至少看起来是这样。

#### [[2025-08-22]]
现在，drawbox和py一样，painter在box的draw函数里面通过自己的属性去设置，而不是在drawmap时预先设置好。此外，对于即将被消除的box，设置了透明度，现在看上去感官上好一点了。

#### [[2025-09-09]]

[(78 封私信 / 81 条消息) Qt6.5项目中引入本地图片的解决方案 - 知乎](https://zhuanlan.zhihu.com/p/676552858)

妈的，这个用vs不好整，还是得用qc

引入了贴图和背景图片，删除了color属性。接下来可以做的
- 玩家美化
	- steve and alex的大头
- 道具美化
	- 加药水什么的
- 保存优化
	- 玩家的toremovebox还是什么
	- 以及很多最近引入的属性
	- 比方说paintremove，这个对于箱子也是成立的
- 代码风格优化
	- 不超过50行
	- 等等

#### [[2025-09-10]]

这个版本的qc用起来特别顺畅，一点也不卡
妈的，我怀疑还是mspcmanager的问题，这个东西真的是该死，活全家的东西

注意到会有碰撞后卡进box内部的问题，考虑
- 位移为0

通过`#define GO_BACK_PORTION 10`从4改为10，基本上撞击后不会退回，于是卡进小的通道里消除也是可以的了。

#### [[2025-09-23]]

新增了player label，显示玩家计分栏

#### [[2025-10-19]]
完成了答辩

[[2025-11-19]]
答辩完成一个月了，已经将仓库设置为public
