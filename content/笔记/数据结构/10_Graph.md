# Part10 图(2025.6.8)
## 1.基本概念
### 无向图
- 路径：在无向图G=(V,{E})中由顶点vi至vj 的顶点序列。
- 回路或环：第一个顶点和最后一个顶点相同的路径。
- 简单回路或简单环：除第一个顶点和最后一个顶点之外，其余顶点不重复出现的回路。
- 连通：顶点vi至vj之间有路径存在。
- 连通图：无向图图 G 的任意两点之间都是连通的，则称 G 是连通图。
- 连通分量：极大连通子图。
- 完全图：有 n(n-1)/2 条边的无向图。其中 n 是结点个数。
- 生成树：极小连通子图。包含图的所有 n 个结点，但只含图的 n-1 条边。在生成树中添加一条边之后，必定会形成回路或环。
### 有向图
- 路径：在有向图G=(V,{E})中由顶点vi经有向边至vj的顶点序列。
- 回路或环：第一个顶点和最后一个顶点相同的路径。
- 简单回路或简单环：除第一个顶点和最后一个顶点之外，其余顶点不重复出现的回路。
- 连通：顶点vi至vj之间有路径存在
- 强连通图：有向图图 G 的任意两点之间都是连通的，则称 G 是强连通图。
- 弱连通：有向图的基图（将有向边变成无向边后形成的图）是连通的。
- 强连通分量：极大连通子图
- 有向完全图：有 n(n-1) 条边的有向图。其中 n 是结点个数。
### 其他术语
边的权值，邻接点，无向图结点的度，有向图结点的出度和入度。
## 2.图的存储
### 邻接矩阵
- 设有向图具有 n 个结点，则用 n 行 n 列的布尔矩阵 A 表示该有向图；如果i 至 j 有一条有向边, A[i, j] = 1 ,如果 i 至 j 没有一条有向边,A[i, j] = 0
- 设无向图具有 n 个结点，则用 n 行 n 列的布尔矩阵 A 表示该无向图；并且 A[i, j] = 1，如果i 至 j 有一条无向边；A[i, j] = 0，如果 i 至 j 没有一条无向边。
- 加权图的邻接矩阵：如果 i 至 j 有一条边，则 A[i, j] = w(i, j)，其中 w(i, j) 为边的权值；如果 i 至 j 没有一条边，则 A[i, j] = 0。
- 代码实现
```cpp
template <class TypeOfVer, class TypeOfEdge>
class adjMatrixGraph:public graph<TypeOfVer, TypeOfEdge> {
public:
    adjMatrixGraph(int vSize, const TypeOfVer d[],
        const TypeOfEdge noEdgeFlag);
    void insert(TypeOfVer x, TypeOfVer y, TypeOfEdge w);
    void remove(TypeOfVer x, TypeOfVer y);
    bool exist(TypeOfVer x, TypeOfVer y) const;
    ~adjMatrixGraph() ；
private:
    TypeOfEdge **edge;    //存放邻接矩阵
    TypeOfVer *ver;       //存放结点值
    TypeOfEdge noEdge;    //邻接矩阵中的∞值
    int find(TypeOfVer v) const {
        for (int i = 0; i < Vers; ++i) if (ver[i] == v) return i; }
};

template <class TypeOfVer, class TypeOfEdge>
adjMatrixGraph<TypeOfVer, TypeOfEdge>::adjMatrixGraph
(int vSize, const TypeOfVer d[], TypeOfEdge noEdgeFlag)
{ 
    int i, j;
    Vers = vSize;
    Edges = 0;
    noEdge = noEdgeFlag;  // 边不存在的标记，若边有权重，可设置特殊值。
    
    //存放结点的数组初始化
    ver = new TypeOfVer[vSize];
    for (i=0; i<vSize;++ i) ver[i] = d[i];
    
    //邻接矩阵初始化
    edge = new TypeOfEdge*[vSize];
    for (i=0; i<vSize; ++ i) {
        edge[i] = new TypeOfEdge[vSize];
        for (j=0; j<vSize; ++j) edge[i][j] = noEdge;
    }
}

template <class TypeOfVer, class TypeOfEdge>
void adjMatrixGraph<TypeOfVer, TypeOfEdge>::insert(TypeOfVer x, TypeOfVer y, TypeOfEdge w)
{
    int u = find(x), v = find(y);
    edge[u][v] = w;
    ++Edges;
}

//Remove：
template <class TypeOfVer, class TypeOfEdge>
void adjMatrixGraph<TypeOfVer, TypeOfEdge>::remove(TypeOfVer x, TypeOfVer y)
{
    int u = find(x), v = find(y);
    edge[u][v] = noEdge;
    --Edges;
}
```
### 邻接表
- 空间 = 结点数 + 边数，时间O(|V| + |E|)。
- 邻接表即每个结点存储一个链表，链表中存储与该结点相邻的结点。
- 代码实现
```cpp
template <class TypeOfVer, class TypeOfEdge>
class adjListGraph:public graph<TypeOfVer, TypeOfEdge> {
public:
    adjListGraph(int vSize, const TypeOfVer d[]);
    void insert(TypeOfVer x, TypeOfVer y, TypeOfEdge w);
    void remove(TypeOfVer x, TypeOfVer y);
    bool exist(TypeOfVer x, TypeOfVer y) const;
    ~adjListGraph() ;
private:
    struct edgeNode {      //邻接表中存储边的结点类
        int end;           //终点存储下标
        TypeOfEdge weight; //边的权值
        edgeNode *next;
        edgeNode(int e, TypeOfEdge w, edgeNode *n = NULL)
        { end = e; weight = w; next = n;}
    };
    
    struct verNode{      //保存顶点的数据元素类型
        TypeOfVer ver;   //顶点值
        edgeNode *head;  //对应的单链表的头指针
        verNode(edgeNode *h = NULL) { head = h;}
    };
    
    verNode *verList;
    int find(TypeOfVer v) const {
        for (int i = 0; i < Vers; ++i)
            if (verList[i].ver == v) return i;
    }
};

template <class TypeOfVer, class TypeOfEdge>
adjListGraph<TypeOfVer, TypeOfEdge>
::adjListGraph(int vSize, const TypeOfVer d[])
{
    Vers = vSize; Edges = 0;
    verList = new verNode[vSize];
    for (int i = 0; i < Vers; ++i) verList[i].ver = d[i];
}

template <class TypeOfVer, class TypeOfEdge>
adjListGraph<TypeOfVer, TypeOfEdge>::~adjListGraph()
{
    int i;
    edgeNode *p;
    for (i = 0; i < Vers; ++i) {
        while ((p = verList[i].head) != NULL) {
            verList[i].head = p->next;
            delete p;
        }
    }    
    delete [] verList;
}

template <class TypeOfVer, class TypeOfEdge>
void adjListGraph<TypeOfVer, TypeOfEdge>::
insert(TypeOfVer x, TypeOfVer y, TypeOfEdge w)
{
    int u = find(x), v = find(y);
    verList[u].head = new edgeNode(v, w, verList[u].head );//插表头
    ++Edges;
}

template <class TypeOfVer, class TypeOfEdge>
void adjListGraph<TypeOfVer,TypeOfEdge>::remove(TypeOfVer x,TypeOfVer y)
{
    int u = find(x), v = find(y);
    edgeNode *p = verList[u].head, *q;
    if (p == NULL) return; //结点u没有相连的边
    if (p->end == v) {     //单链表中的第一个结点就是被删除的边
        verList[u].head = p->next;
        delete p;
        --Edges;
        return;
    }
    while (p->next != NULL && p->next->end != v) p = p->next;//查找被删除的边
    if (p->next != NULL) { //删除
        q = p->next; p->next = q->next; delete q; --Edges;
    }//同链表删除
}

template <class TypeOfVer, class TypeOfEdge>
bool adjListGraph<TypeOfVer, TypeOfEdge>
::exist(TypeOfVer x, TypeOfVer y) const
{
    int u = find(x), v = find(y);
    edgeNode *p = verList[u].head;
    while (p !=NULL && p->end != v) p = p->next;
    if (p == NULL) return false; else return true;
}
```
## 3.深度优先搜索（dfs）
1. 选中第一个被访问的顶点；
2. 对顶点作已访问过的标志；
3. 依次从顶点的未被访问过的第一个、第二个、第三个…… 邻接顶点出发，进行深度优先搜索；
4. 如果还有顶点未被访问，则选中一个起始顶点，转向2；
5. 所有的顶点都被访问到，则结束。
### 代码实现
```cpp
template <class TypeOfVer, class TypeOfEdge>
void adjListGraph<TypeOfVer, TypeOfEdge>::dfs() const
{
    bool *visited = new bool[Vers];
    for (int i=0; i < Vers; ++i) visited[i] = false;
    cout << "当前图的深度优先遍历序列为：" << endl;
    for (i = 0; i < Vers; ++i) {
        if (visited[i] == true) continue;
        dfs(i, visited);//调用私有DFS函数
        cout << endl;
    }
}

template <class TypeOfVer, class TypeOfEdge>
void adjListGraph<TypeOfVer, TypeOfEdge>::dfs
(int start, bool visited[]) const
{
    edgeNode *p = verList[start].head;
    cout << verList[start].ver << '\t';
    visited[start] = true;
    while (p != NULL){ //注意邻接表和邻接矩阵此处的实现细节
        if (visited[p->end] == false) dfs(p->end, visited);
        p = p->next;
    }
}
```
### 效率分析
- 如果图是用邻接表来表示，则时间代价和顶点数 |V| 及边数 |E| 相关，即是O(|V|+|E|)。
- 如果图是用邻接矩阵来表示，则所需要的时间是O(|V|^2)。
## 4.广度优先搜索（bfs）
1. 记录每个结点是否已被访问。
2. 将当前被访问结点的后继结点，依次放入一个队列。
3. 重复取队列的队头元素进行处理，直到队列为空。对出队的每个元素，首先检查该元素是否已被访问。如果没有被访问过，则访问该元素，并将它的所有的没有被访问过的后继入队。
4. 检查是否还有结点未被访问。如果有，重复上述两个步骤.
### 代码实现
```cpp
template <class TypeOfVer, class TypeOfEdge>
void adjListGraph<TypeOfVer, TypeOfEdge>::bfs() const
{
    bool *visited = new bool[Vers];
    int currentNode;
    linkQueue<int> q;
    edgeNode *p;
    for (int i=0; i < Vers; ++i) visited[i] = false;
    cout << "当前图的广度优先遍历序列为：" 
         << endl;
    //记录每个结点是否已被访问
    for (i = 0; i < Vers; ++i)
    {
        if (visited[i] == true) continue;
        //此算法缺省从0下标结点开始遍历
        q.enQueue(i);
        while (!q.isEmpty())
        {
            currentNode = q.deQueue();
            if (visited[currentNode] == true) continue;
            cout << verList[currentNode].ver << '\t';
            visited[currentNode] = true;
            p = verList[currentNode].head;
            while (p != NULL)
            {
                if (visited[p->end] == false) q.enQueue(p->end);
                p = p->next;
            }
        }
        cout << endl;
    }
}
```
### 效率分析
- 如果图是用邻接表来表示，则时间代价和顶点数 |V| 及边数 |E| 相关，即是O(|V|+|E|)。
- 如果图是用邻接矩阵来表示，则所需要的时间是O(|V|^2)。
## 5.拓扑排序
### 排序过程
1. 第一个输出的结点（序列中的第一个元素）： 必须无前驱，即入度为0。
2. 后驱：必须等到它的前驱输出之后才输出。
3. 无前驱及后件的结点：任何时候都可输出。
4. 逻辑删除法：当某个节点被输出后，就作为该节点被删除。所有以该节点作为前驱的所有节点的入度减1。
### 排序实现
1. 计算每个结点的入度，保存在数组inDegree中；
2. 检查inDegree中的每个元素，将入度为0的结点入队；
3. 不断从队列中将入度为0的结点出队，输出此结点，并将该结点的后继结点的入度减1；如果某个邻接点的入度为0，则将其入队。
### 代码实现
```cpp
template <class TypeOfVer, class TypeOfEdge>
void adjListGraph<TypeOfVer, TypeOfEdge>::topSort( ) const
{
    linkQueue<int> q;
    edgeNode *p;
    int current, *inDegree = new int[Vers];
    for (int i = 0; i < Vers; ++i) inDegree[i] = 0;
    for ( i = 0; i < Vers; ++i)
        for (p = verList[i].head; p != NULL; p = p->next)
            ++inDegree[p->end];
    for (i = 0; i < Vers; ++i) if (inDegree[i] == 0) q.enQueue(i);
    cout << "拓扑排序为：" << endl;
    while( !q.isEmpty( ) ){
        current = q.deQueue( );
        cout << verList[current].ver << '\t';
        for (p = verList[current].head; p != NULL; p = p->next)
            if( --inDegree[p->end] == 0 ) q.enQueue( p->end );
    }
    cout << endl;
}
```
### 效率分析
- 如果图以邻接表表示，计算入度需要O（|V|+|E|）的时间，搜索入度为0的结点需要O（|V|）的时间。每个结点入一次队、出一次队。每出一次队，需要检查它的所有后继结点，因此也需要O（|V|+|E|）的时间。所以总的执行时间也是O（|V|+|E|）。
## 6.关键路径
### 关键路径的概念
- AOE网络：顶点表示事件，有向边的权值表示某个活动的持续时间，有向边的方向表示事件发生的先后次序。
- AOE网络可用于描述整个工程的各个活动之间的关系，活动安排的先后次序。在此基础上，可以用来估算工程的完成时间以及那些活动是关键的活动。
- 完成整项工程至少的时间：起点到终点的最长路径，即关键路径。
- 影响工程进度的活动：活动时间余量为0的活动，称为关键活动。
### 利用正向拓扑排序求事件结点（顶点）最早发生时间
- 利用拓扑排序算法求事件结点的最早发生时间的执行步骤：
1. 设每个结点（始发边）的最早发生时间为0，将入度为零的结点进栈。
2. 将栈中入度为零的结点V取出，并压入另一栈，用于形成逆向拓扑排序的序列。
3. 根据邻接表找到结点V的所有的邻接结点，将结点V的最早发生时间 + 活动的权值得到的和同邻接结点的原最早发生时间进行比较；如果该值大，则用该值取代原最早发生时间。另外，将这些邻接结点的入度减一。如果某一结点的入度变为零，则进栈。
4. 反复执行2、3；直至栈空为止。
### 关键路径寻找过程
- 找出每个顶点的最早发生时间和最迟发生时间
   - 最早发生时间：每个直接前驱的最早发生时间加上从该前驱到该顶点的活动时间的最大者（正向拓扑排序）
   - 最迟发生时间：每个直接后继的最迟发生时间减去顶点到该直接后继的活动时间的最小者就是该顶点的最迟发生时间。（逆向拓扑排序：可以理解为将图中的箭头全部取反，以结束事件为起点进行正向拓扑排序，时间从最早发生时间开始减去权值）
- 找出两个时间相等的顶点就是关键路径上的顶点。
### 算法实现
```cpp
template <class TypeOfVer, class TypeOfEdge>
void adjListGraph<TypeOfVer, TypeOfEdge>
::criticalPath( ) const
{
    TypeOfEdge *ee = new TypeOfEdge[Vers],
               *le = new TypeOfEdge[Vers];
    int *top = new int[Vers], *inDegree = new int[Vers];
    linkQueue<int> q;
    int i;
    edgeNode *p;

    // 找出拓扑序列，放入数组top
    for (i = 0; i < Vers; ++i) { //计算每个结点的入度
        inDegree[i] = 0;
        for (p = verList[i].head; p != NULL; p = p->next)
            ++inDegree[p->end];
    }
    for (i = 0; i < Vers; ++i) //将入度为0的结点入队
        if (inDegree[i] == 0) q.enQueue(i);

    i = 0;
    while( !q.isEmpty( ) ) {
        top[i] = q.deQueue( );
        for (p = verList[top[i]].head; p != NULL; p = p->next)
            if( --inDegree[p->end] == 0 ) q.enQueue( p->end );
        ++i;
    }

    // 找最早发生时间
    for (i = 0; i < Vers; ++i) ee[i] = 0;
    for (i = 0; i < Vers; ++i) { // 找出最早发生时间存于数组ee
        for (p = verList[top[i]].head; p != NULL; p = p->next)
            if (ee[p->end] < ee[top[i]] + p->weight )
                ee[p->end] = ee[top[i]] + p->weight;
    }

    // 找最晚发生时间
    for (i = 0; i < Vers; ++i) le[i] = ee[Vers -1];
    for (i = Vers - 1; i >= 0 ; --i) // 找出最晚发生时间存于数组le
        for (p = verList[top[i]].head; p != NULL; p = p->next)
            if(le[p->end] - p->weight < le[top[i]] )
                le[top[i]] = le[p->end] - p->weight;

    // 找出关键路径
    for (i = 0; i < Vers; ++i)
        if (le[top[i]] == ee[top[i]])
            cout << "(" << verList[top[i]].ver
                 << ", " << ee[top[i]] << ") ";
}
```