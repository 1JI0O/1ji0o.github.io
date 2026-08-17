# Part5 优先级队列(2025.6.7)
## 1.基本概念
- 优先级队列是一种特殊的队列，其中每个元素都有一个优先级。出队时，优先级高的元素会先被处理。优先级队列可以用来实现任务调度、事件处理等。
### 优先级队列的简单实现：
  - 方式一：入队时，按照优先级数值在队列（线性表）中寻找合适的位置，将新入队的元素插入在此位置。出队操作的实现保持不变。
  - 方式二：入队时将新入队的元素直接放在队尾。但出队时，在整个队列中查找优先级最高的元素，让它出队。
  - 时间复杂度分析：
    - 方式一：入队操作的时间复杂度为O(n)，出队操作的时间复杂度为O(1)。
    - 方式二：入队操作的时间复杂度为O(1)，出队操作的时间复杂度为O(n)。
## 2.二叉堆
- 二叉堆是一种特殊的完全二叉树，分为最大化堆(大顶堆)和最小化堆(小顶堆)满足堆的性质：对于每个节点，其值都大于或等于（或小于或等于）其子节点的值。  
```  
例如:序列 { 2,3,4,5,7,10,23,29,60 } 是最小化堆  
序列 { 12,7,8,4,6,5,3,1} 是最大化堆  
教材默认最小化堆  
```
### 优先级队列的堆实现
使用二叉堆来实现优先级队列，入队和出队操作的时间复杂度均为O(log n)。
#### 类定义
```cpp
template <class Type>
class priorityQueue:public queue<Type>
{
private:
    int currentSize;
    Type *array;
    int maxSize; //同顺序表定义
    void doubleSpace();
    void buildHeap( );//建堆
    void percolateDown( int hole ); //堆调整
public:
    priorityQueue( int capacity = 100 ) {
        array = new Type[capacity];
        maxSize = capacity;
        currentSize = 0;
    }//顺序表初始化
    priorityQueue( const Type data[], int size );//建堆过程
    ~priorityQueue() { delete [] array; }
    bool isEmpty( ) const { return currentSize == 0; }
    void enQueue( const Type & x );//入队
    Type deQueue();
    Type getHead() { return array[1]; }//array[0]做了哨兵
};
```
#### 小顶堆进队（向上过滤）
最坏情况（插入结点调整到顶）下一次完整调整过程的时间复杂度为O(log n)，因此入队操作的时间复杂度为O(log n)。
```cpp
template <class Type>
void priorityQueue<Type>::enQueue( const Type & x )
{
    if( currentSize == maxSize - 1 ) doubleSpace();
    // 向上过滤（调整）
    int hole = ++currentSize;
    for( ; hole > 1 && x < array[ hole / 2 ]; hole /= 2 ) { //注意边界及下标的含义
        array[ hole ] = array[ hole / 2 ];
    }
    array[ hole ] = x;
}
```
#### 小顶堆出队（向下过滤）
出队操作的时间复杂度为O(log n)。
```cpp
template <class Type>
Type priorityQueue<Type>::deQueue()
{
    Type minItem;
    minItem = array[ 1 ];//堆顶下标为1或者0，可自行定义
    array[ 1 ] = array[ currentSize-- ];
    percolateDown( 1 );
    return minItem;
}

template <class Type>
void priorityQueue<Type>::percolateDown(int hole) {
    int child;                // 子节点索引
    Type tmp = array[hole];   // 保存当前节点的值

    // 循环直到当前节点没有子节点
    for (; hole * 2 <= currentSize; hole = child) {
        child = hole * 2;     // 左子节点

        // 如果右子节点存在且更小，则选择右子节点
        if (child != currentSize && array[child + 1] < array[child]) {
            child++;
        }

        // 如果子节点比当前节点小，则交换
        if (array[child] < tmp) {
            array[hole] = array[child];
        } else {
            break;  // 否则终止循环
        }
    }

    // 将初始节点值放到最终位置
    array[hole] = tmp;
}
```
#### 建堆
- 可以采取N次连续插入的方式，但是，其时间复杂度O(NlogN)，故不采纳。
- 实际上建堆的时间复杂度为O(N)，可以通过从最后一个非叶子节点开始向下过滤的方式实现。
```cpp
// percolateDown(int hole)部分
Type tmp = array[ hole ];
for( ; hole * 2 <= currentSize; hole = child ) {
    child = hole * 2;
    if( child != currentSize && array[ child + 1 ] < array[ child ] ) child++;
    if( array[ child ] < tmp ) array[ hole ] = array[ child ];
    else break;
}
array[ hole ] = tmp;
```
- 复杂度推导即每一层结点的数量乘2的深度次方倍的和，使用可以错位相消推导。

