# Part3 队列(2025.6.6)
## 1.队列的抽象类
```cpp
template <class elemType>
class queue
{
public:
    virtual bool isEmpty() const = 0;
    virtual void enQueue(const elemType &x) = 0;
    virtual elemType deQueue() = 0;
    virtual elemType getHead() const = 0;
    virtual ~queue() {}
};
```
## 2.顺序存储实现
### 实现分类
1. 使用数组存储队列中的元素。
2. 节点个数用MaxSize维护。
3. 下标范围为0到MaxSize-1。
4. 分三种组织方式：
   - 队头位置固定：出队会引起大量的数据移动。
   - 队头位置不固定：操作为O(1)，但需要记录队头和队尾的位置,同时会浪费数组空间。
   - 循环队列：队头和队尾位置可以循环使用，避免了空间浪费，同时避免大量的数据移动。

## 3.循环队列
- front指向队头前方的位置。
- rear指向队尾位置。
### 操作实现
#### 改进前：队头可以存储元素
```cpp
rear = (rear + 1) % maxSize; elem[rear] = x;// 入队
front = (front + 1) % maxSize; // 出队
```
- 最后一个元素出队时，front = (front + 1) % maxSize，front和rear相等，表示队列为空。
- 只剩最后一个空位置，执行入队操作，rear = (rear + 1) % maxSize，front和rear相等，表示队列满。  
***循环队列front除了初始状态时，其余时间不一定指向0号下标。Front和rear“你逃我追”***
#### 改进后：队头不存储元素
- “牺牲”一个单元，规定front指向的单元不能存储队列元素，只起到标志作用，表示后面一个是队头元素。
- 当rear“绕一卷”赶上front时，队列就满了。因此队列满的条件是：(rear + 1) % MaxSize == front.
- 队列空的条件是：rear == front。即队头追上了队尾。
### 类定义
```cpp
template <class elemType>
class seqQueue: public queue<elemType>
{
private:
    elemType *elem;
    int front; // 队头位置
    int rear;  // 队尾位置
    int maxSize;
    void doubleSpace();
public:
    seqQueue(int initSize = 10);
    ~seqQueue();
    bool isEmpty() const;
    void enQueue(const elemType &x);
    elemType deQueue();
    elemType getHead() const;
};
```
### 类实现
```cpp
//构造函数
template <class elemType>
seqQueue<elemType>::seqQueue(int initSize)
{
    elem = new elemType[initSize];
    maxSize = initSize;
    front = 0;
    rear = 0;
}

//析构函数
template <class elemType>
seqQueue<elemType>::~seqQueue()
{
    delete[] elem;
}

//入队
template <class elemType>
void seqQueue<elemType>::enQueue(const elemType &x)
{
    if ((rear + 1) % maxSize == front) doubleSpace(); // 队列满时扩容
    rear = (rear + 1) % maxSize; // 更新队尾位置
    elem[rear] = x;
}

//扩充空间
template <class elemType>
void seqQuene<elemType>::doubleSpace()
{
    elemType* tmp = elem;
    elem = new elemType[2 * maxSize];
    for (int i = 0; i < maxSize; ++i) {
        elem[i] = tmp[(front + i) % maxSize]; // 重新排列元素
    }
    front = 0; // 重置队头位置
    rear = maxSize - 1; // 更新队尾位置
    maxSize *= 2; // 更新最大容量
    delete [] tmp; // 释放旧空间
}

//出队
template <class elemType>
elemType seqQueue<elemType>::deQueue()
{
    if (isEmpty()) throw "Queue is empty"; // 队列为空时抛出异常
    front = (front + 1) % maxSize; // 更新队头位置
    return elem[front]; // 返回队头元素
}

//判队空
template <class elemType>
bool seqQueue<elemType>::isEmpty() const
{
    return front == rear; // 队头追上队尾，表示队列为空
}
```
## 4.队列的链表实现
对链式队列的操作基本等同于对链表的操作，只是需要维护队头和队尾指针，限制了修改链表的位置。此处不再实现。
### 顺序实现与链接实现的比较
- 时间：两者都能在常量的时间`O(1)`内完成基本操作，但顺序队列由于采用回绕，使入队和出队的处理比较麻烦。
- 空间：链接队列中每一个节点多一个指针字段，空间利用率较高。顺序队列由于长度预指定，数组中可能有大量未使用的空间。
