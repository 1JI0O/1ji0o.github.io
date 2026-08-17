# Part7 动态查找(2026.6.7)
## 1.二叉查找树
- 二叉查找树或者为空，或者满足以下性质：
  1. 每个结点的左子树中所有结点的值都小于该结点的值。
  2. 每个结点的右子树中所有结点的值都大于该结点的值。
  3. 每个结点的左、右子树也是二叉查找树。
### 类定义
```cpp
template <class KEY, class OTHER>
class BinarySearchTree: public dynamicSearchTable<KEY, OTHER>
{
private:
    struct BinaryNode
    {
        SET<KEY, OTHER> data;
        BinaryNode *left;
        BinaryNode *right;
        BinaryNode( const SET<KEY, OTHER> & thedata,
            BinaryNode *lt=NULL, BinaryNode *rt=NULL )
            : data( thedata ), left( lt ), right( rt ) { }
    };
    BinaryNode *root;

public:
    BinarySearchTree( ) ;
    ~BinarySearchTree( );
    SET<KEY, OTHER> *find(const KEY &x) const ;
    void insert( const SET<KEY, OTHER> & x );
    void remove( const KEY & x );

private:
    void insert( const SET<KEY, OTHER> & x, BinaryNode *& t );
    void remove( const KEY & x, BinaryNode *& t );
    SET<KEY, OTHER> *find(const KEY &x, BinaryNode *t ) const;
    void makeEmpty( BinaryNode *t );
};

//查找
template <class KEY, class OTHER>
SET<KEY, OTHER> *BinarySearchTree<KEY, OTHER>::find(const KEY &x， BinaryNode* t) const
{
    if (t == nullptr || t->data.key == x) return (t);
    if (x < t->data.key) return find(x, t->left);
    else return find(x, t->right);
}

//插入
template <class KEY, class OTHER>
void BinarySearchTree<KEY, OTHER>::insert(const SET<KEY, OTHER> & x, BinaryNode *& t)
{
    if (t == nullptr) {
        t = new BinaryNode(x， nullptr, nullptr);
    } else if (x.key < t->data.key) {
        insert(x, t->left);
    } else if (x.key > t->data.key) {
        insert(x, t->right);
    }
}

//删除
//Case1 删除叶结点：直接删除，更改它的父亲结点的相应指针字段为空。这不会改变二叉查找树的特性。
//Case2 删除只有一个孩子的结点：将它的父亲结点的相应指针字段指向它的孩子结点。这也不会改变二叉查找树的特性。
//Case3 删除有两个孩子的结点：
//对策1：用左子树中的最大值做替身。
//对策2：用右子树中的最小值做替身。
//先将替身的数据字段复制到被删结点；
//将原替身的另一儿子作为它的父亲结点的儿子，究竟是作为左儿子还是右儿子依原替身结点和其父亲结点的关系而定；
//释放原替身结点的空间；
//删除替身结点。

template <class KEY, class OTHER>
void BinarySearchTree<KEY, OTHER>::remove( const KEY & x, BinaryNode * & t )
{
    if( t == NULL ) return;
    if ( x < t->data.key ) remove( x, t->left );
    else if( t->data.key < x ) remove( x, t->right );
    else if( t->left != NULL && t->right != NULL ) { // 有两个孩子
        BinaryNode *tmp = t->right;
        while (tmp->left != NULL) tmp = tmp->left;
        t->data = tmp->data; // 右子树中的最小结点
        remove( t->data.key, t->right ); // 从右子树中删除替代点
    }
    else { // 被删结点是叶结点或只有一个孩子
        BinaryNode *oldNode = t;
        t = ( t->left != NULL ) ? t->left : t->right; // 参数中引用&的作用
        delete oldNode;
    }
}
```
### 二叉查找树的平均性能
#### 最优情况（平衡BST）
- **树高度**：O(log n)
- **查找/插入/删除时间复杂度**：O(log n)
- **条件**：树完全平衡，左右子树高度差≤1
#### 最差情况（退化成链表）
- **树高度**：O(n)
- **查找/插入/删除时间复杂度**：O(n)
- **条件**：所有节点只有左子树或右子树
#### 平均情况分析
- n 个结点二叉查找树左子树的节点数有n种可能性，如果概率是相等的。设P(n)为查找n个结点的二叉查找树的平均查找时间，则:
```
P(n) = sum(i = 0 ~ n - 1){1/n * [1 + (P(i) * i + (P(n - i - 1) + 1) * (n - i - 1))]}
= 2 * (1 + 1/n) * ln(n) = 1.38log(n)
```
## 2.平衡二叉查找树
- 平衡因子（平衡度）：结点的平衡度是结点的左子树的高度－右子树的高度。
- 空树的高度定义为0（树的高度的定义）。
- 平衡二叉树：每个结点的平衡因子都为 ＋1、－1、0 的二叉树。或者说每个结点的左右子树的高度最多差1的二叉树。
- 可以证明平衡树的高度至多约为：1.44log(N+2) -1.328
### 平衡二叉树的性能(记忆)
定理：具有 N 个结点的平衡树，高度 h 满足： 
```
log(2, N+1) <= h <= 1.44log(2, N+1) - 0.328;
```
因此，平衡二叉树的操作都是O(logN)。
### 类定义
```cpp
template <class KEY, class OTHER>
class AvlTree: public dynamicSearchTable<KEY, OTHER> {
    struct AvlNode
    {
        SET<KEY, OTHER> data; //结点数据（键值， 其他数据）
        AvlNode *left; //右树指针
        AvlNode *right; //左树指针
        int height; //结点的高度(配合插入删除算法）
        AvlNode( const SET<KEY, OTHER> &element ,
            AvlNode *lt, AvlNode *rt, int h=1)
            : data(element), left( lt ), right( rt ), height(h) { }
    };
    AvlNode *root;
    
public:
    AvlTree() { root = NULL; }
    ~AvlTree( ) { makeEmpty( root); }
    SET<KEY, OTHER> *find( const KEY & x ) const;
    void insert( const SET<KEY, OTHER> & x ) ;
    void remove( const KEY & x );
    
private:
    void insert( const SET<KEY, OTHER> & x, AvlNode * & t ) ;
    bool remove( const KEY & x, AvlNode * & t ) ;
    void makeEmpty( AvlNode *t );
    int height( AvlNode *t ) const { return t == NULL ? 0 : t->height;}//空树高度为0
    void LL( AvlNode * & t );
    void LR( AvlNode * & t );
    void RL( AvlNode * & t );
    void RR( AvlNode * & t );
    int max(int a, int b) {return (a>b)?a:b;}
    bool adjust(AvlNode *&t, int subTree); //删除过程中的调整
};
```
### 查找
```cpp
//查找的非递归实现
template <class KEY, class OTHER>
SET<KEY, OTHER> *AvlTree<KEY, OTHER>::find(const KEY &x) const
{
    AvlNode *t = root;
    while (t!=NULL && t->data.key != x) {
        if (t->data.key > x) t = t->left;
        else t = t->right;
    }
    if (t==NULL) return NULL;
    else return t;
}
```
### 插入
```cpp
//插入
template <class KEY, class OTHER>
void AvlTree<KEY, OTHER>::insert(const SET<KEY, OTHER> &x, AvlNode *&t)
{
    if (t == NULL) // 在空树上插入
        t = new AvlNode(x, NULL, NULL);
    else if (x.key < t->data.key) { // 在左子树上插入
        insert(x, t->left);
        if (height(t->left) - height(t->right) == 2) // t失衡
            if (x.key < t->left->data.key)
                LL(t); // 左左情况 - 右单旋
            else
                LR(t); // 左右情况 - 先左旋后右旋
    }
    else if (t->data.key < x.key) { // 在右子树上插入
        insert(x, t->right);
        if (height(t->right) - height(t->left) == 2) // t失衡
            if (t->right->data.key < x.key)
                RR(t); // 右右情况 - 左单旋
            else
                RL(t); // 右左情况 - 先右旋后左旋
    }
    // 重新计算t的高度
    t->height = max(height(t->left), height(t->right)) + 1; // 调用树高的操作求左右子树高度
}

//LL情况(O(1))
template <class KEY, class OTHER>
void AvlTree<KEY, OTHER>::LL( AvlNode * & t )
{
    AvlNode *t1 = t->left; // 未来的树根
    t->left = t1->right;
    t1->right = t;
    t->height = max( height( t->left ), height( t->right ) ) + 1;
    t1->height = max( height( t1->left ), height(t)) + 1;
    t = t1;
}

//RR情况(O(1))
template <class KEY, class OTHER>
void AvlTree<KEY, OTHER>::RR( AvlNode * & t )
{
    AvlNode *t1 = t->right; // 未来的树根
    t->right = t1->left;
    t1->left = t;
    t->height = max( height( t->left ), height( t->right ) ) + 1;
    t1->height = max( height( t1->right ), height(t)) + 1;
    t = t1;
}

//LR情况(先RR再LL)
template <class KEY, class OTHER>
void AvlTree<KEY, OTHER>::LR( AvlNode * & t )
{
    RR( t->left );
    LL( t );
}

//RL情况(先LL再RR)
template <class KEY, class OTHER>
void AvlTree<KEY, OTHER>::RL( AvlNode * & t )
{
    LL( t->right );
    RR( t );
}
```
### 删除
- 结点删除同二叉查找树。在删除了叶结点或只有一个孩子的结点后，子树变矮，返回false。
- 每次递归调用后，检查返回值。如果是true，直接返回true。否则分5种情况进行处理。
```cpp
// Case1:删除前平衡因子为0，左子树删除一个结点后平衡因子变为-1，但没有失衡，高度没变，其父结点无需继续调整;
// Case2:删除前平衡因子为＋1，左子树删除一个结点后平衡因子变为0，没有失衡，但高度变矮，通知其父结点需继续检查调整;
// Case3:删除前-1，删除后-2; 失衡， RR旋转，高度变矮通知其父结点需继续检查调整;
// Case4:Case4:删除前-1，删除后-2;失衡， RL旋转，高度变矮通知其父结点需继续检查调整;
// Case5:删除前-1，删除后-2; 失衡，RR或RL旋转都可以，高度没变

template <class KEY, class OTHER>
bool AvlTree<KEY, OTHER>::remove(const KEY &x, AvlNode *&t)
{
    if (t == NULL) return true;  // 未找到要删除的节点
    
    if (x == t->data.key) {      // 找到要删除的节点（根节点）
        if (t->left == NULL || t->right == NULL) {  // 叶节点或只有一个子节点
            AvlNode *oldNode = t;
            t = (t->left != NULL) ? t->left : t->right;  // 用非空子树替代当前节点
            delete oldNode;
            return false;  // 子树高度改变，可能需要调整
        }
        else {  // 有两个子节点
            AvlNode *tmp = t->right;
            while (tmp->left != NULL) tmp = tmp->left;  // 找到右子树的最小节点
            t->data = tmp->data;                         // 用最小节点值替代当前节点
            if (remove(tmp->data.key, t->right))         // 递归删除右子树的最小节点
                return true;
            return adjust(t, 1);  // 删除发生在右子树，需要调整右子树平衡
        }
    }
    
    if (x < t->data.key) {  // 在左子树上删除
        if (remove(x, t->left))
            return true;
        return adjust(t, 0);  // 删除发生在左子树，需要调整左子树平衡
    }
    else {  // 在右子树上删除
        if (remove(x, t->right))
            return true;
        return adjust(t, 1);  // 删除发生在右子树，需要调整右子树平衡
    }
}
```
### 调整
- 进入调整函数，一定是某棵子树变矮了；
- 调整函数检查结点有没有失衡。如果失衡，则做相应的调整；
- 函数的返回值是子树有没有变矮，变矮返回false，否则返回true；
- 函数的第一个参数是所要检查的结点的地址t。第二个参数是t的哪棵子树变矮了。0是左子树变矮，1 是右子树变矮。
```cpp
template <class KEY, class OTHER>
bool AvlTree<KEY, OTHER>::adjust(AvlNode *&t, int subTree)
{
    if (subTree) { // 在右子树上删除，使右子树变矮
        if (height(t->left) - height(t->right) == 1) return true; // 情况a：已平衡
        
        if (height(t->right) == height(t->left)) { // 情况b：高度不变但需更新
            --t->height; 
            return false;
        }
        
        if (height(t->left->right) > height(t->left->left)) { // 情况d：LR型失衡
            LR(t); 
            return false; 
        }
        
        LL(t); // 情况c和e：LL型失衡
        if (height(t->right) == height(t->left)) 
            return false; 
        else 
            return true;
    }
    else { // 在左子树删除
        if (height(t->right) - height(t->left) == 1) return true; // 情况a：已平衡
        
        if (height(t->right) == height(t->left)) { // 情况b：高度不变但需更新
            --t->height;
            return false;
        }
        
        if (height(t->right->left) > height(t->right->right)) { // 情况d：RL型失衡
            RL(t);
            return false;
        }
        
        RR(t); // 情况c和e：RR型失衡
        if (height(t->right) == height(t->left))
            return false;
        else
            return true;
    }
}
```
### 总结
- 与插入操作一样， 失衡节点存在于被删节点到根节点的路径上；
- 在删除一个结点后，必须沿着到根结点的路径向上回溯，随时调整路径上的结点的平衡度；
- 插入时，最多只需要调整一个结点。而删除时，无法保证子树在平衡调整后的高度不变。只有当某个结点的高度在删除前后保持不变，才无需继续调整；
- 递归的删除函数有一个布尔型的返回值。当返回值为true时，调整停止。当返回值为false时，继续调整。
## 3.哈希查找
不比较关键字的大小。以关键字值 KEY为自变量，利用哈希函数计算查找位置。理想情况下，时间复杂度为 `O(1)`。但它不支持有关有序操作。
### 哈希函数
- 每个结点在表中的存储位置是由一个函数H确定。该函数以结点的关键字值为自变量，计算出该关键字对应的结点的存储位置。该函数称为哈希函数。
- 哈希函数的值域为 `0 ~(m - 1)`
- 哈希函数的选择标准
   - 计算速度快
   - 散列地址尽可能均匀，使得冲突机会尽可能的少
### 常用的哈希（散列）函数：用于查找的哈希
#### 直接地址法
`H(key) = key 或 H(key) = a * key ＋ b `如：关键字集合为`{100，400，600，200，800，900}`，取散列函数为`H(x)=key`，则需要901个单元。取`H(x)=x/100`，需要10个单元。
#### 除留余数法
- `H(key)= key MOD p 或 H(key)= key MOD p + c` 这里p为小于等于m素数。如：`m = 1024`, 则 `p = 1019` 。
- 最常用，余数总在 `0 ～ p-1` 之间。
- 选取 p 为素数，散列函数值分布会比较均匀。（较好）
#### 数字分析法
- 对关键字集合中的所有关键字，分析每一位上数字分布。取数字分布均匀的位作为地址的组成部分。
```
3 4 7 0 5 2 4
3 4 9 1 5 8 7
3 4 8 2 5 9 6
3 4 8 5 5 7 0
3 4 8 6 5 0 5
3 4 9 8 5 5 8
3 4 7 9 5 7 1
1-2-3-4-5-6-7----列数
```
第1、2、5列对区分不同的关键字完全没有意义，第3列意义较小。于是可以只选择4、6、7三列的值。
#### 平方取中法
- 将关键字平方后，取其结果的中间各位作为散列函数值。由于中间各位和每一位数字都有关系，因此均匀分布的可能性较大。
- 比如：4731 * 4731 = 22，382，361。中间部分究竟要选取几位，依赖于散列表的单元总数。若散列表总共有100 个单元，我们可以选取最中间的部分，即第4、5位，那么关键字值为4731的结点的散列地址可选为82。
#### 折叠法
- 如果关键字相当长，以至于和散列表的单元总数相比大得多时，可采用此法。
- 具体实现：是选取一个长度后，将关键字按此长度分组相加。
- 例如，关键字值为542242241，按3位折叠，可以得到542+242+241=1025。抛弃进位，得到散列结果为25。
### 冲突问题
要选择一个一一对应的哈希函数很困难。一般的哈希函数都是多对一。当两个以上的关键字映射到一个存储单元时，称为冲突或碰撞。
### 闭散列表法：利用本散列表中的空余单元
#### 线性探测法
发生冲突时探测下一个单元，直到找到空闲单元为止。即：`H(key) = (H(key) + i) MOD m` 其中i为探测次数。  
- 初级冲突：不同关键字值的结点得到同一个散列地址。  
- 二次聚集：同不同散列地址的结点争夺同一个单元。  
- 结果：冲突加剧，最坏时可能达到 O（n）级代价。
#### 二次探测再散列，随机探测再散列
- 二次探测：`H(key) = (H(key) + i^2) MOD m` 其中i为探测次数。
- 随机探测：`H(key) = (H(key) + i * rand()) MOD m` 其中i为探测次数，rand()为随机数。
#### 再hashing法
- 出现冲突时，采用多个 hashing 函数计算散列地址，直到找到空单元为止。  
`Hi = RHi(key) i=1,2,…,k`  
RHi为不同的哈希函数。
- 例如，若两个hashing函数，则探测序列如下：  
`H1(x)，(H1(x)+H2(x))mod M，(H1(x)+2*H2(x))mod M……`  
不容易“聚集”，但增加了计算时间。
#### 代码实现
```cpp
template <class KEY, class OTHER>
class closeHashTable : public dynamicSearchTable<KEY, OTHER> {
private:
    struct node { //闭散列表的结点类
        SET<KEY, OTHER> data;
        int state; //0 --empty 1 --active 2 --deleted
        node() { state = 0; }
    };
    node *array;
    int size;
    int (*key)(const KEY &x);
    static int defaultKey(const int &x) { return x; } //将非整数型关键字转换为整数型
    
public:
    closeHashTable(int length = 101, int (*f)(const KEY &x) = defaultKey);
    ~closeHashTable() { delete[] array; }
    SET<KEY, OTHER> *find(const KEY &x) const;
    void insert(const SET<KEY, OTHER> &x);
    void remove(const KEY &x);
};

//构造函数
template <class Type>
closeHashTable<Type>::closeHashTable(int length, int (*f)(const Type &x) )
{
    size = length;
    array = new node[size];
    key = f;
}

//插入
template <class KEY, class OTHER>
void closeHashTable<KEY, OTHER>::insert(const SET<KEY, OTHER> &x)
{
    int initPos, pos;
    initPos = pos = key(x.key) % size; // 假设哈希函数为取模运算
    
    do {
        if (array[pos].state != 1) { // 找到空单元或已删除单元
            array[pos].data = x;
            array[pos].state = 1;    // 标记为活动状态
            return;
        }
        pos = (pos+1) % size;        // 线性探测法解决冲突
    } while (pos != initPos);        // 循环终止条件：回到起始位置
    
    // 如果执行到这里说明哈希表已满
}

//移除
template <class KEY, class OTHER>
void closeHashTable<KEY, OTHER>::remove(const KEY &x)
{
    int initPos, pos;
    initPos = pos = key(x) % size; // 假设哈希函数为取模运算
    
    do {
        if (array[pos].state == 0) 
            return; // 遇到空单元说明元素不存在
        
        if (array[pos].state == 1 && array[pos].data.key == x) { // 找到目标元素
            array[pos].state = 2; // 标记为删除状态（惰性删除）
            return;
        }
        
        pos = (pos + 1) % size; // 线性探测继续查找
    } while (pos != initPos); // 循环终止条件：回到起始位置
}

//查找
template <class KEY, class OTHER>
SET<KEY, OTHER> *closeHashTable<KEY, OTHER>::find(const KEY &x) const
{
    int initPos, pos;
    initPos = pos = key(x) % size;  // 计算初始哈希位置
    
    do {
        if (array[pos].state == 0)
            return NULL;  // 遇到空单元说明元素不存在
        
        if (array[pos].state == 1 && array[pos].data.key == x)  // 找到活跃的匹配元素
            return (SET<KEY, OTHER> *)&array[pos].data;  // 返回数据指针
        
        pos = (pos + 1) % size;  // 线性探测继续查找
    } while (pos != initPos);  // 循环终止条件：回到起始位置
    
    return NULL;  // 遍历整个表后未找到
}
```
### 开散列表法
- 链地址法 ：将具有同一散列地址的结点保存于M 存区的各自的链表之中。
- 公共溢出区法：将发生冲突的结点都存放在一个公共溢出区内。M 存区只存放一个记录。发生冲突的记录都存放在公共溢出区内。M 存区和公共溢出区都可以分配几个磁道或柱面作为存储空间。
#### 类定义（了解）
```cpp
template <class KEY, class OTHER>
class openHashTable : public dynamicSearchTable<KEY, OTHER> {
private:
    struct node { // 开散列表中链表的结点类
        SET<KEY, OTHER> data;
        node *next;
        node(const SET<KEY, OTHER> &d, node *n = NULL)
        { data = d; next = n; }
        node() { next = NULL; }
    };
    
    node **array; // 指针数组（每个元素是链表头指针）
    int size;
    int (*key)(const KEY &x);
    static int defaultKey(const int &x) { return x; }
    
public:
    openHashTable(int length = 101,
                 int (*f)(const KEY &x) = defaultKey);
    ~openHashTable();
    SET<KEY, OTHER> *find(const KEY &x) const;
    void insert(const SET<KEY, OTHER> &x);
    void remove(const KEY &x);
};

//构造函数
template <class KEY, class OTHER>
openHashTable<KEY, OTHER>::openHashTable
(int length, int (*f)(const KEY &x) )
{
    size = length;
    array = new node* [size];
    key = f;
    for (int i = 0; i < size; ++i) array[i] = NULL;
}

//析构函数
template <class KEY, class OTHER>
openHashTable<KEY, OTHER>::~openHashTable()
{  
    node *p, *q;
    for (int i = 0; i< size; ++i) {
        p = array[i];
        while (p!=NULL) { q= p->next; delete p; p = q; } ;
    }
    delete [] array;
}

//插入函数
template <class KEY, class OTHER>
void openHashTable<KEY, OTHER>::insert
(const SET<KEY, OTHER> &x)
{
    int pos ;
    node *p;
    pos = key(x.key) % size;
    array[pos] = new node(x, array[pos]);//插入表头位置
}

//删除函数
template <class KEY, class OTHER>
void openHashTable<KEY, OTHER>::remove(const KEY &x)
{
    int pos ;
    node *p, *q;
    pos = key(x) % size;
    if (array[pos] == NULL) return;
    p = array[pos];
    if (array[pos]->data.key == x) { // 删除第一个节点(不带表头结点）
        array[pos] = p->next; delete p; return;
    }
    while (p->next != NULL && !(p->next->data.key == x) ) p = p->next;
    if (p->next != NULL) {
        q = p->next; p->next = q->next; delete q;
    }
}

//查找函数
template <class KEY, class OTHER>
SET<KEY, OTHER> *openHashTable<KEY, OTHER>
::find(const KEY &x) const
{
    int pos ;
    node *p;
    pos = key(x) % size;
    p = array[pos];
    while (p != NULL && !(p->data.key == x) ) p = p->next;
    if (p == NULL) return NULL;
    else return (SET<KEY, OTHER> *)p;
}
```