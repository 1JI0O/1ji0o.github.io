# Patr4 树(2025.6.7)
## 1.树的抽象类
```cpp
template<class T>
class tree {
public:
    virtual void clear() = 0;
    virtual bool isEmpty() const = 0;
    virtual T root(T flag) const = 0; //非空，返回根节点；空树，返回flag
    virtual T parent(T x, T flag) const = 0;
    virtual T child（T x, int i, T flag) const = 0;
    virtual void remove(T x, int i) = 0;
    virtual void traverse() const = 0;
};
```
## 2.二叉树
### 基本定义
1. 二叉树（Binary Tree）是结点的有限集合，它或者为空，或者由一个根结点及两棵互不相交的左、右子树构成，而其左、右子树又都是二叉树。
2. 注意：二叉树必须严格区分左右子树。即使只有一棵子树，也要说明它是左子树还是右子树。交换一棵二叉树的左右子树后得到的是另一棵二叉树。
3. 二叉树和有序树是不同的概念。
4. 树和二叉树都是树型结构。二叉树不是一种特殊的树。二叉树可以为空。树不能为空 。
### 满二叉树
- 一棵高度为k并具有2k－1个结点的二叉树称为满二叉树。
- 一棵二叉树中任意一层的结点个数都达到了最大值。
### 完全二叉树
在满二叉树的基础上，最后一层的结点可以不满，但必须从左到右依次排列。
- 所有叶结点都出现在最低的两层上。
- 对任意结点，如果其右子树高度为k，则其左子树高度为k或k-1。
### 二叉树性质
1. 一棵非空二叉树的第 i 层上最多有`2^(i - 1)`个结点（i≥1）。
2. 一颗高度为k的二叉树最多有`2^k - 1`个结点。
3. 对于一棵非空二叉树，如果叶子结点数为`n0`，度数（子结点的个数）为2的结点数为`n2`，则有:`n0 ＝ n2 ＋ 1` 成立。  
*结论推广：对于一棵非空K叉树，如果叶子结点数为*`n0`*，度数为2的结点数为*`n2`*，依次类推，度数为k的结点数为*`nk`*，则有:*  
`n0 ＝ n2 ＋ 2 * n3 + … + (k - 1) * nk + 1`成立。
5. 具有n个结点的完全二叉树的高度`k = int(log(2, n)) + 1`
### 二叉树抽象类
```cpp
template<class T>
class bTree {
public:
    virtual void clear() = 0;
    virtual bool isEmpty() const = 0;
    virtual T Root(T flag) const = 0;
    virtual T parent(T x， T flag) const = 0;
    virtual T lchild（T x, T flag) const = 0;
    virtual T rchild（T x, T flag) const = 0;
    virtual void delLeft(T x) = 0;
    virtual void delRight(T x) = 0;
    virtual void preOrder() const = 0;
    virtual void midOrder() const = 0;
    virtual void postOrder() const= 0;
    virtual void levelOrder() const = 0;
};
```
### 二叉树的遍历
1. 前序遍历  
如果二叉树为空，则操作为空，否则：  
- 访问根结点  
- 前序遍历左子树  
- 前序遍历右子树  
3. 中序遍历  
如果二叉树为空，则操作为空，否则：  
- 中序遍历左子树  
- 访问根结点  
- 中序遍历右子树
4. 后序遍历  
如果二叉树为空，则操作为空，否则：
- 后序遍历左子树
- 后序遍历右子树
- 访问根结点 
  
*Tip:根据前序序列+中序序列可以唯一确定一棵二叉树。根据后序序列+中序序列也可以唯一确定一棵二叉树。*
### 二叉树的类定义
```cpp
template<class T>
class binaryTree : public bTree<T> {
    friend void printTree(const binaryTree &t, T flag);
private:
struct Node { //二叉树结点
    Node *left , *right ;
    T data;
    Node() : left(NULL), right(NULL) { }
    Node(T item, Node *L = NULL, Node * R =NULL ) :
    data(item), left(L), right(R) {}
    ~Node() {}
};
    Node *root;
public:
    binaryTree() : root(NULL) {}
    binaryTree(T x) { root = new Node(x); }
    ~binaryTree();
    void clear() ;//删除整棵树
    bool isEmpty() const;
    T Root(T flag) const;
    T lchild(T x, T flag) const;
    T rchild(T x, T flag) const;
    void delLeft(T x) ;
    void delRight(T x);
    void preOrder() const;//遍历整棵二叉树 （包裹函数，下同）
    void midOrder() const;
    void postOrder() const;
    void levelOrder() const;
    void createTree(T flag);//输入一颗二叉树
private:
    Node *find(T x, Node *t ) const;//t为当前根
    void clear(Node *&t) ;
    void preOrder(Node *t) const;
    void midOrder(Node *t) const;
    void postOrder(Node *t) const;
};

//判树空
template<class T>
bool binaryTree<T>::isEmpty() const {
    return root == NULL;
}

//求树根
template<class T>
T binaryTree<T>::Root(T flag) const {
    if (root == nullptr) return flag;
    else return root->data;
}

//求结点数
template<class T>
int binaryTree<T>::count(Node *t) const {
    if (t == nullptr) return 0;
    return 1 + count(t->left) + count(t->right);
}

//求树高
template<class T>
int binaryTree<T>::height(Node *t) const {
    if (t == nullptr) return 0;
    int leftHeight = height(t->left);
    int rightHeight = height(t->right);
    return (leftHeight > rightHeight ? leftHeight : rightHeight) + 1;
}

//清空树
template<class T>
void binaryTree<T>::clear() {
    clear(root);
}
template<class T>
void binaryTree<T>::clear(Node *&t) {
    if (t != nullptr) {
        clear(t->left);
        clear(t->right);
        delete t;
        t = nullptr;
    }
}

//前序遍历
template<class T>
void binaryTree<T>::preOrder(binaryTree<T>::Node *t) const
{
    if (t == NULL) return;
    cout << t->data << ' ';
    preOrder(t->left);
    preOrder(t->right);
}

//中序遍历
template<class T>
void binaryTree<T>::midOrder(binaryTree<T>::Node *t) const
{
    if (t == NULL) return;
    midOrder(t->left);
    cout << t->data << ' ';
    midOrder(t->right);
}

//后序遍历
template<class T>
void binaryTree<T>::postOrder(binaryTree<T>::Node *t) const
{
    if (t == NULL) return;
    postOrder(t->left);
    postOrder(t->right);
    cout << t->data << ' ';
}

//层次遍历（需要辅助队列）
template<class T>
void binaryTree<T>::levelOrder() const {
    linkQueue< Node * > que; //辅助队列
    Node *tmp;
    que.enQueue(root); //可以先判断root是否为空
    while (!que.isEmpty()) {
        tmp = que.deQueue();
        cout << tmp->data << ' ';
        if (tmp->left) que.enQueue(tmp->left);
        if (tmp->right) que.enQueue(tmp->right);
    }
}
```
### 层次构建二叉树
```cpp
template <class Type>
void BinaryTree<Type>::createTree(Type flag)
{
    linkQueue<Node *> que;//队列结点为指向Node的指针
    Node *tmp;
    Type x, ldata, rdata;
    //创建树，输入flag表示空
    cout << "\n输入根结点：";
    cin >> x;
    root = new Node(x);
    que.enQueue(root);
    while (!que.isEmpty()) {
        tmp = que.deQueue();
        cout << "\n输入" << tmp->data << "的两个儿子(" << flag << "表示空结点)：";
        cin >> ldata >> rdata;
        if (ldata != flag）que.enQueue(tmp->left = new Node(ldata));
        if (rdata != flag) que.enQueue(tmp->right = new Node(rdata));
    }
    cout << "create completed!\n";
}
```

### 二叉树遍历的非递归实现
- 递归是程序设计中强有力的工具。
- 递归程序结构清晰、明了、美观。
- 递归程序的弱点：它的时间、空间的效率比较低。
- 所以在实际使用中，我们常常希望使用它的非递归版本。二叉树的遍历也是如此。尽管二叉树遍历的递归函数非常简洁，但有时我们还是希望使用速度更快的非递归函数。
#### 非递归前序遍历
- 前序遍历第一个被访问的结点是根结点，然后访问左子树，最后访问右子树。
- 可以设置一个栈，保存将要访问的树的树根。
- 开始时，把二叉树的根结点存入栈中。然后重复以下过程，直到栈为空：
  - 从栈中取出一个结点，输出根结点的值；
  - 然后把右子树，左子树放入栈中。
```cpp
template <class Type>
void BinaryTree<Type>::preOrder() const
{
    linkStack<Node *> s;
    Node *current;
    cout << "前序遍历: ";
    s.push(root);//root是否为NULL?
    while (!s.isEmpty()) {
        current = s.pop();
        cout << current->data;
        if ( current->right != NULL ) s.push( current->right );
        if ( current ->left != NULL ) s.push( current->left );
    }
}
```

#### 非递归中序遍历
- 采用一个栈存放要遍历的树的树根。
- 中序遍历中，先要遍历左子树，接下去才能访问根结点，因此，当根结点出栈时，我们不能访问它，而要访问它的左子树，此时要把树根结点暂存一下。
- 由于左子树访问完后还要访问根结点，因此仍可以把它存在栈中，接着左子树也进栈。此时执行出栈操作，出栈的是左子树。左子树问结束后，再次出栈的是根结点，此时根结点可被访问。根结点访问后，访问右子树，则将右子树进栈。
```cpp
//（1）初始化：根结点timespop=0,入栈。
//（2）出栈，如果timespop==0,则 timespop+=1,入栈，左子结点timespop=0,入栈；
// 如果timespop==1,则访问它，其右儿子timespop=0,入栈。
//（3）重复(2)直至栈空。

struct StNode
{
    Node *node;
    int TimesPop;
    StNode ( Node *N = NULL ):node(N), TimesPop(0) {} //TimesPop初始赋值0
}; 

template <class Type>
void BinaryTree<Type>::midOrder() const{
    linkStack<StNode> s;
    StNode current(root); //提前判断一下是否是空树
    cout << "中序遍历: ";
    s.push(current);
    while (!s.isEmpty()) {
        current = s.pop();
        if ( ++current.TimesPop == 2 ) { //TimesPop的变化
            cout << current.node->data;
            if ( current.node->right != NULL ) s.push(StNode(current.node->right ));
        }
        else { s.push( current );
            if ( current.node->left != NULL ) s.push(StNode(current.node->left));
        }
    }
}
```
#### 非递归后序遍历
- 将中序遍历的非递归实现的思想进一步延伸，可以得到后序遍历的非递归实现。
- 当以后序遍历一棵二叉树时，先将树根进栈，表示要遍历这棵树。
- 根结点第一次出栈时，根结点不能访问，应该访问左子树。于是，根结点重新入栈，并将左子树也入栈。
- 根结点第二次出栈时，根结点还是不能访问，要先访问右子树。于是，根结点再次入栈，右子树也入栈。
- 当根结点第三次出栈时，表示右子树遍历结束，此时，根结点才能被访问。
```cpp
//（1）初始化：根结点timespop=0,入栈
//（2）出栈，如果timespop==0,则timespop+=1,再次入栈;
// 同时，左子结点timespop=0，入栈；
// 如果timespop==1，则 timespop+=1,再次入栈，同时，其右儿子timespop=0,入栈;
// 如果timespop==2，则访问。
//（3）重复（2）直至栈空

template <class Type>
void BinaryTree<Type>::postOrder() const
{
    linkStack< StNode > s;
    StNode current(root);
    cout << "后序遍历: ";
    s.push(current);
    while (!s.isEmpty()) {
        current = s.pop();
        if (++current.TimesPop == 3) { //TimesPop的变化
            cout << current.node->data;
            continue;
        }
        s.push(current);
        if (current.TimesPop == 1) {
            if (current.node->left != NULL) s.push(StNode(current.node->left));
        } else {
            if (current.node->right != NULL) s.push(StNode(current.node->right));
        }
    }
}
```
## 3.哈夫曼树与哈夫曼编码
### 前缀编码与哈夫曼树
- 字符只放在叶结点中。
- 字符编码可以有不同长度。
- 每个字符的编码都不可能是其他字符编码的前缀
- 前缀编码可被惟一解码
- 哈夫曼树是一棵最小代价的二叉树，所有的字符都包含在叶结点上。
### 哈夫曼算法
1. 给定一个具有`n`个权值的结点的集合A。
2. 执行`n - 1`次循环,在每次循环时执行以下操作:从当前集合中选取权值最小、次最小的两个结点，以这两个结点作为内部结点`bi`的左右儿子，`bi`的权值为其左右儿子权值之和。
3. 在集合中去除这两个权值最小、次最小的结点，并将内部结点`bI`加入其中。这样，在集合A中，结点个数便减少了一个。这样，在经过了`n-1`次循环之后，集合A中只剩下了一个结点，这个结点就是根结点。
### 哈夫曼树的存储
1. 在哈夫曼树中，每个要编码的元素是一个叶结点，其它结点都是度数为`2`的节点。
2. 一旦给定了要编码的元素个数，由`n0 ＝ n2 ＋ 1`可知哈夫曼树的大小为`2n-1`。
3. 哈夫曼树可以用一个大小为`2n`的数组来存储。`0`**位置不用**，根存放在下标`1`位置。叶结点依次放在`n+1`到`2n`的位置。
4. 每个数组元素保存的信息：结点的数据、权值和父结点和左右孩子的位置。
5. 数组下标的意义：
   - `1`表示根结点。
   - `2i`表示结点`i`的左孩子。
   - `2i + 1`表示结点`i`的右孩子。
   - `i / 2`表示结点`i`的父结点。
### 哈夫曼树的实现
```cpp
template <class Type>
class hfTree {
private:
    struct Node {
        Type data;
        int weight;
        int parent, left, right;
    }
    Node* elem;
    int length;
public:
    struct hfCode {
        Type data;
        string code;
    };
    hfTree(const Type* x, const int* w, int size);
    ~hfTree() { delete[] elem; }
    void getCode(hfCode result[]);
}

//构造函数
template <class Type>
hfTree<Type>::hfTree(const Type* v, const int* w, int size) {
    const int MAX_INT = 32767;
    int min1, min2;  // 最小树、次最小树的权值
    int x, y;        // 最小树、次最小树的下标
    
    // 初始化树的结构
    length = 2 * size;
    elem = new Node[length];
    
    // 初始化叶子节点（存储在数组的后半部分）
    for (int i = size; i < length; ++i) {
        elem[i].weight = w[i - size];
        elem[i].data = v[i - size];
        elem[i].parent = elem[i].left = elem[i].right = 0;
    }
    
    // 构造新的二叉树（从后向前构建非叶子节点）
    for (int i = size - 1; i > 0; --i) {
        min1 = min2 = MAX_INT; // min1存储最小权重，min2存储次小权重
        x = y = 0; // x存储次小权重下标，y存储最小权重下标
        
        // 找到当前未处理的两个最小权重的节点
        for (int j = i + 1; j < length; ++j) {
            if (elem[j].parent == 0) {
                if (elem[j].weight < min1) {
                    min2 = min1;
                    min1 = elem[j].weight;
                    x = y; // 更新次小权重下标为之前的最小权重下标
                    y = j; // 最小元素下表更新为当前下标
                }
                else if (elem[j].weight < min2) {
                    min2 = elem[j].weight;
                    x = j;
                }
            }
        } 
        
        // 合并最小的两个节点，形成新的父节点
        elem[i].weight = min1 + min2;
        elem[i].left = x;
        elem[i].right = y;
        elem[i].parent = 0;  // 新节点的父节点暂时设为 0
        
        // 更新子节点的父节点指向
        elem[x].parent = i;
        elem[y].parent = i;
    }
}
```
### getCode()函数的实现
```cpp
template <class Type>
void hfTree<Type>::getCode(hfCode result[]) {
    int size = length / 2;  // 叶子节点的数量
    int p, s;               // p: 父节点索引, s: 当前节点索引

    // 遍历所有叶子节点
    for (int i = size; i < length; ++i) {
        // 存储当前节点的数据
        result[i - size].data = elem[i].data;
        // 初始化编码为空字符串
        result[i - size].code = "";

        // 从叶子节点回溯到根节点生成编码
        p = elem[i].parent;  // 获取父节点
        s = i;               // 当前节点

        while (p != 0) {  // 未到达根节点
            if (elem[p].left == s) {
                // 如果是左孩子，添加'0'
                result[i - size].code = '0' + result[i - size].code;
            } else {
                // 如果是右孩子，添加'1'
                result[i - size].code = '1' + result[i - size].code;
            }
            
            // 向上回溯
            s = p;                // 当前节点变为父节点
            p = elem[p].parent;   // 父节点变为祖父节点
        }
    }
}
```
### 示例
```cpp
        [1] (26)
       /   \
   [2](14) [5](12)
   /   \
[3](5) [4](9)
```
叶子节点：
`elem[3]`：`A`（权重 5）  
`elem[4]`：`B`（权重 9）  
`elem[5]`：`C`（权重 12）  
生成的编码：  
`A`（`elem[3]`）：  
父节点是`[2]`，且是左孩子 → 添加 `0`。  
父节点是`[1]`，且是左孩子 → 添加 `0`。  
最终编码：`00`  
`B`（`elem[4]`）：  
父节点是`[2]`，且是右孩子 → 添加 `1`。  
父节点是`[1]`，且是左孩子 → 添加 `0`。  
最终编码：`01`   
`C`（`elem[5]`）：  
父节点是`[1]`，且是右孩子 → 添加 `1`。  
最终编码：`1`  

