# Part2 栈(2025.6.6)
## 1.栈的抽象类
```cpp
template <class elemType>
class stack
{
public:
    virtual bool isEmpty() const = 0;
    virtual void push(const elemType &x) = 0;
    virtual elemType pop() = 0;
    virtual elemType top() const = 0;
    virtual ~stack() {}
};
```
## 2.顺序栈
### 代码实现
```cpp
//类定义
template <class elemType>
class seqStack: public stack<elemType>
{
private:
    elemType *elem;
    int top_p;//栈顶
    int maxSize;
    void doubleSpace();
public:
    seqStack(int initSize = 10) ；
    ~seqStack()；
    bool isEmpty() const；
    void push(const elemType &x) ；
    elemType pop()；
    elemType top() const；
}；

//构造函数
template <class elemType>
seqStack<elemType>::seqStack(int initSize) {
    elem = new elemType[initSize];
    maxSize = initSize ; top_p = -1;
}

//析构函数
template <class elemType>
seqStack<elemType>:: ~seqStack()
{ delete [] elem; }

//判栈空
template <class elemType>
bool seqStack<elemType>:: isEmpty() const
{ return top_p == -1; }

//入栈
template <class elemType>
void seqStack<elemType>::push(const elemType &x)
{
    if (top_p == maxSize - 1) doubleSpace();
    elem[++top_p] = x;
}

//出栈
template <class elemType>
elemType seqStack<elemType>::pop()
{ return elem[top_p--]; }

//读栈顶
template <class elemType>
elemType seqStack<elemType>::top() const
{ return elem[top_p]; }

//扩充空间
template <class elemType>
void seqStack<elemType>::doubleSpace(){
    elemType *tmp = elem;
    elem = new elemType[2 * maxSize];
    for (int i = 0; i < maxSize; ++i) elem[i] = tmp[i];
    maxSize *= 2;
    delete [] tmp;
}
```
### 性能分析
除进栈操作外，由于只在栈顶进行一次操作，所有实现的时间复杂度均为O(1) 
  
进栈运算最坏情况下需要O(n)的时间复杂度（进行了一次doubleSpace操作）
但是将每一次扩充数组的操作均摊到前n次进栈操作上，平均每次进栈操作的时间复杂度仍然为O(1)
即插入运算的时间复杂度仍然为O(1)

## 3.链栈
### 代码实现
```cpp
template <class elemType>
class linkStack: public stack<elemType>
{
private:
    struct node {
        elemType data;
        node *next;
        node(const elemType &x, node *n = nullptr) : data(x), next(n) {}
        node() : next(nullptr) {}
        ~node() {}
    };
    node *top_p;
public:
    linkStack() : top_p(nullptr) {}
    ~linkStack();
    bool isEmpty() const;
    void push(const elemType &x);
    elemType pop();
    elemType top() const;
};

template <class elemType>
linkStack<elemType>::linkStack() : top_p(nullptr) {}

template <class elemType>
linkStack<elemType>::~linkStack() {
    node* tmp;
    while (top_p != nullptr) {
        tmp = top_p;
        top_p = top_p->next;
        delete tmp;
    };
}
```
其余的读栈顶，弹出，入栈操作均与链表类似
## 4.栈的应用
### 括号配对检查
1. 首先创建一个空栈。
2. 从源程序中读入符号。
3. 如果读入的符号是开符号，那末就将其进栈。
4. 如果读入的符号是一个闭符号但栈是空的，出错。否则，将栈中的符号出栈。
5. 如果出栈的符号和和读入的闭符号不匹配，出错。
6. 继续从文件中读入下一个符号，非空则转向3，否则执行7。
7. 如果栈非空，报告出错，否则括号配对成功。
### 简单计算器的实现
计算机中的算术运算常用后缀表达式（逆波兰式），其优点是不需要考虑运算符的优先级。
#### 中缀表达式转后缀表达式的步骤
1. 若读入的是操作数，立即输出。
2. 若读入的是闭括号，则将栈中的运算符依次出栈，并将其放在操作数序列之后。出栈操作一直进行到遇到相应的开括号为止。将开括号出栈。
3. 若读入的是开括号，则进栈。
4. 若读入的是运算符，如果栈顶运算符优先级高，则栈顶运算符出栈；出栈操作一直要进行到栈顶运算符优先级低为止，然后将新读入的运算符进栈保存。
```
关于优先级相关概念的解释：
当你读取到一个运算符时（比如 +, -, *, / 等），你需要决定是直接将其压入栈中，还是先弹出栈顶的运算符。
而这一决定基于当前读取的运算符与栈顶运算符的优先级比较：
如果栈顶的运算符的优先级**高于或等于**当前读取的运算符，那么栈顶运算符应该先被弹出（输出到后缀表达式中），因为高优先级的运算符应该先计算。
然后继续比较新的栈顶运算符，直到栈顶的运算符优先级低于当前读取的运算符，或者栈为空。
最后，将当前读取的运算符压入栈中。
```
5. 在读入操作结束时，将栈中所有的剩余运算符依次出栈，并放在操作数序列之后，直至栈空为止。
#### 后缀表达式的求解方法
简单而言就是从左到右扫描后缀表达式，遇到操作数就进栈，遇到运算符就出栈两个操作数进行计算，然后将结果进栈，直到栈中只有最后一个结果为止。 
#### 一些注意事项
1. 依次扫描表达式expression直到表达式结束，每次取一个符号。
2. 很多程序员在写算术表达式时都习惯在运算符的前后插入一些空格，使表达式看上去更加清晰。这些空格对表达式的计算是没有意义的，在扫描过程中要忽略这些空格。
3. 当遇到了一个有意义的语法单位时，需要判断是否遇到的是运算数，如果是运算数，则转换成整型数存入参数value，返回符号VALUE。如果不是运算数，则根据不同的运算符返回不同的token类型的值。

