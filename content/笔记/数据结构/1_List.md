# Part1 线性表(2025.6.6)
## 1.概念与定义
空或者只有一个结点。或者  
1、存在唯一的一个被称之为“第一个”的结点。  
2、存在唯一的一个被称之为“最后一个”的结点。  
3、除第一个结点之外，每个结点均只有一个前驱结点。  
4、除最后一个结点之外，每个结点均只有一个后继结点。  
## 2.抽象类
~~~cpp
template <class elemType>
class list
{ 
public: 
    virtual void clear() = 0;  //纯虚函数
    virtual int length() const = 0;
    virtual void insert(int i, const elemType &x) = 0; 
    virtual void remove(int i) = 0;  
    virtual int search(const elemType &x) const = 0 ;
    virtual elemType visit(int i) const = 0;
    virtual void traverse() const = 0；
    virtual ~list() {};
};
~~~
## 3.顺序表类
~~~cpp
//抽象类的子类
template <class elemType>
class seqList: public list<elemType>
{
private:
    elemType *data;
    int currentLength;
    int maxSize;
    void doubleSpace();//扩容
public:
    seqList(int initSize = 10);
    ~seqList()  {delete [] data;}
    void clear()  {currentLength = 0;}
    int length() const {return currentLength;}
    void insert(int i, const elemType &x); 
    void remove(int i);  
    int search(const elemType &x) const ;
    elemType visit(int i) const;
    void traverse() const ;
};

//构造函数
template <class elemType>
seqList<elemType>::seqList(int initSize)
{
    data = new elemType[initSize]; //可增加考虑健壮性
    maxSize = initSize; 
    currentLength = 0;
}

//查找
template <class elemType>
int seqList<elemType>::search(const elemType &x) const 
{
    for (int i = 0; i < currentLength; i++)
        if (i == currentLength) {
            return -1;
        else return i;
    }
}

//遍历
template <class elemType>
int seqList<elemType>::traverse() comst
{
    for (int i = 0; i < currentLength; i++)
        cout << data[i] << " ";
    cout << endl; 
}

//插入
//时间复杂度：最好O(1)，最坏O(n)，平均O(n)
template <class elemType>
void seqList<elemType>::insert(int i, const elemType &x)
{
    if (i < 0 || i > currentLength) throw OutOfBound();
    if (currentLength == maxSize) doubleSpace(); 
    for (int j = currentLength; j > i; j--) data[j] = data[j-1];
    data[i] = x;
    ++currentLength;
}

//扩充空间
template <class elemType>
void seqList<elemType>::doubleSpace()
{
    elemType *tmp = data;
    data = new elemType[2 * maxSize];
    for (int i = 0; i < currentLength; i++) data[i] = tmp[i];
    maxSize *= 2;
    delete [] tmp;
}

//删除
template <class elemType>
void seqList<elemType>::remove(int i)
{
    if (i < 0 || i > currentLength) throw OutOfBound();
    for (int j = i; j < currentLength - 1; j++) data[j] = data[j + 1];
    --currentLength;
}
~~~
## 4.链式表类
### 单链表类
~~~cpp
template <class elemType>
class sLinkList: public list<elemType>
{
private:
struct node
{ //单链表中的结点类
    elemType data;
    node *next;
    node(const elemType &x, node *n = NULL) { data = x; next = n; }
    node( ): next(NULL) {}
    ~node() {}
};
    node *head; //头指针
    int currentLength; //表长
    node *move(int i) const; //返回第i个元素的地址
public:
    sLinkList() ;
    ~sLinkList() {clear(); delete head; }
    void clear() ;
    int length() const {return currentLength;}
    void insert(int i, const elemType &x);
    void remove(int i);
    int search(const elemType &x) const ;
    elemType visit(int i) const;
    void traverse() const ;
};

//构造函数
template <class elemType>
sLinkList<elemType>::sLinkList()
{
    head = new node; //创建头结点
    currentLength = 0;
}

//清空
template <class elemType>
void sLinkList<elemType>::clear()
{
    node *p = head->next, *q;
    while (p != NULL) {
        q = p->next;
        delete p;
        p = q;
    }
    head->next = NULL; //重置头结点
    currentLength = 0;
}

//返回第i个元素的指针
template <class elemType>
sLinkList<elemType>::node *sLinkList<elemType>::move(int i) const
{
    node* p = head;
    while (i-- >= 0) p = p->next;
    return p;
}

//查找
template <class elemType>
int sLinkList<elemType>::search(const elemType &x) const 
{
    node *p = head->next;
    int i = 0;
    while (p != NULL && p->data != x) { p = p->next; ++i; }
    if (p == NULL) return -1; 
    else return i;
}

//遍历
template <class elemType>
void sLinkList<elemType>::traverse() const 
{
    node *p = head->next;
    while (p != NULL) {
        cout << p->data << " ";
        p = p->next;
    }
    cout << endl;
}
~~~
### 双链表类
~~~cpp
template <class elemType>
class dLinkList: public list<elemType>
{
private:
struct node { //双链表中的结点类
    elemType data;
    node *prev, *next;
    node(const elemType &x, node *p = NULL, node *n = NULL) { data = x; next = n; prev = p; }
    node( ):next(NULL), prev(NULL) {}
    ~node() {}
};
    node *head, *tail; //头尾指针
    int currentLength; //表长
    node *move(int i) const; //返回第i个元素的地址
public:
    dLinkList() ;
    ~dLinkList() {clear(); delete head; delete tail;}
    void clear() ;
    int length() const {return currentLength;}
    void insert(int i, const elemType &x);
    void remove(int i);
    int search(const elemType &x) const ;
    elemType visit(int i) const;
    void traverse() const ;
};

//构造函数
template <class elemType>
dLinkList<elemType>::dLinkList()
{
    head = new node; //创建头结点
    tail = new node; //创建尾结点
    head->next = tail; //头结点指向尾结点
    tail->prev = head; //尾结点指向头结点
    currentLength = 0;
}

//插入
template <class elemType>
void dLinkList<elemType>::insert(int i, const elemType &x)
{
    node *pos, *tmp;
    pos = move(i); //注意，move需要自行实现
    tmp = new node(x, pos->prev, pos); //结点构造函数
    pos->prev->next = tmp;
    pos->prev = tmp;
    ++currentLength;
}

//删除
template <class elemType>
void dLinkList<elemType>::remove(int i)
{
    node *pos;
    pos = move(i); //注意，move需要自行实现
    pos->prev->next = pos->next;
    pos->next->prev = pos->prev;
    delete pos;
    --currentLength;
}
~~~
双向链表中查找、访问、遍历等操作与单链表类似，只是需要注意前驱和后继指针的使用，此处不再实现。
### 单循环链表类
- 一般单循环链表不带头结点。
- Head为头指针。（头指针和头结点有区别）
- 插入操作时间复杂度为O(1)，删除操作时间复杂度为O(n)，查找操作时间复杂度为O(n)。
### 双循环链表类
- 首元素中prior字段给出尾元素的地址，尾元素中next字段给出首元素的地址。
- 一般也不设头尾结点（注意头/尾结点；头/尾指针；首/尾元素的区分）
- 插入操作时间复杂度为O(1)，删除操作时间复杂度为O(n)，查找操作时间复杂度为O(n)。