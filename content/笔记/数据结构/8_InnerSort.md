# Part8 内排序(2025.6.7)
## 1.直接插入排序
### 代码实现
```cpp
template <class KEY, class OTHER>
void simpleInsertSort(SER<KEY, OTHER> a[], int size) {
    int k;
    SET<KEY, OTHER> tmp;
    for (int j = 1; j < size; ++j) {
        tmp = a[j];
        for (k = j - 1; k >= 0 && tmp.key < a[k].key; --k) {
            a[k + 1] = a[k];
        }
        a[k + 1] = tmp;
    }
}
```
### 效率分析
- 最好情况：O(n)，当数据已经有序时。
- 最坏情况：O(n^2)，当数据完全逆序时。
- 平均情况：O(n^2)，稳定的排序算法，因为每次插入都需要遍历已排序部分。
- 使用情况：排序元素较少，且几乎是已排序。
### 折半插入排序
- 利用二份查找伐快速找到插入位置，减少比较次数。
- 最坏情况下总的移动次数还是O(n^2)，但比较次数减少到O(nlogn)。
## 2.希尔排序
- 设有n个对象待排序；
- 首先取一个gap < n作为增量；
- 将待排序的n个对象分成gap个子序列，每个子序列包含相隔gap个元素的对象；
- 在每个子序列中进行直接插入排序；
- 缩小增量gap，重复上述过程，直到gap为1。
### 代码实现
```cpp
template <class KEY, class OTHER>
void shellSort(SET<KEY, OTHER> a[], int size) {
    int step, i, j;
    SET<KEY, OTHER> tmp;
    for (step = size / 2; step > 0; step /= 2) {
        for (i = step; i < size; ++i) {
            tmp = a[i];
            for (j = i - step; j >= 0 && a[j].key > tmp.key; j -= step) {
                a[j] = a[j - step];
            }
            a[j] = tmp;
        }
    }
}
```
### 效率分析
- 不同的增量序列有不同的时间性能；
- 希尔建议gap从N/2开始，逐渐平分减小到1；
- 最坏时间复杂度为O(n^2)，但平均时间复杂度为O(n^(3/2))，不稳定的排序算法。

## 3.选择排序
- 首先，从待排序的n个元素中选出最小的元素，存放在序列的起始位置；  
- 然后，再从剩余的n-1个元素中选出最小的元素，放在已排序序列的末尾；
- 最后，重复上述过程，将每次得到的元素排成一个序列直到所有元素均排序完成。
### 直接选择排序
- 首先在所有元素中逐个比较选出最小元素；
- 然后将最小元素与第一个元素交换位置；
- 接着在剩余的n-1个元素中重复上述过程，直到所有元素均排序完成。
- 时间复杂度为O(n^2)，不稳定的排序算法。
#### 代码实现
```cpp
template <class KEY, class OTHER>
void simpleSelectSort(SET<KEY, OTHER> a[], int size) {
    int i, j, min;
    SET<KEY, OTHER> tmp;
    for (i = 0; i < size - 1; i++) {
        min = i;
        for (j = i + 1; j < size; j++) {
            if (a[j].key < a[min].key) min = j;
        }
        tmp = a[i];
        a[i] = a[min];
        a[min] = tmp;
    }
}
```
### 堆选择排序
- 使用buildHeap对N个元素创建一个优先级队列；
- 通过调用N次deQueue操作取出每一个项即可1完成排序。
- 建堆的复杂度为O(n)，使用基于堆的优先级队列选出最小元素只需要O(log(n))的时间。
- 总时间复杂度为O(nlog(n))，不稳定的排序算法。
#### 代码实现
```cpp
template <class KEY, class OTHER>
void heapSelectSort(SET<KEY, OTHER> a[], int size) {
   int i;
   SET<KEY, OTHER> tmp;
   // 创建初始堆，存储下标从0或1开始皆可
   for (i = size / 2; i >= 0; --i) {
       percolateDown(a, i, size);
   }
   //执行N - 1次deQueue操作
   for (i = size - 1; i > 0; --i) {
       tmp = a[0]; // 取出堆顶元素
       a[0] = a[i]; // 将最后一个元素放到堆顶
       a[i] = tmp; // 将堆顶元素放到已排序部分
       percolateDown(a, 0, i); // 调整堆
   }
}
```
- percolateDown函数的实现参考优先级队列
## 4.交换排序
- 交换排序即根据对数据元素的比较确定是否交换二者的位置。
- 常见的交换排序有冒泡排序、快速排序等。
### 冒泡排序
- 从头到尾比较相邻元素，将小的换到前面，大的换到后面，完成一趟过程称为一次起泡，可以将最大元素交换到最后位置。
- 在从头到倒数第二个元素完成第二次起泡，以此类推，经过n - 1次起泡后将倒数第n - 1个大的元素放到第二个单元。
#### 代码实现
```cpp
template <class KEY, class OTHER>
void bubbleSort(SET<KEY, OTHER> a[], int size) {
    int i, j;
    SET<KEY, OTHER> tmp;
    bool flag = true; // 标志是否有交换发生
    for (i = 1; i < size && flag; ++i) {
        for (j = 0; j < size - i; ++j) {
            if (a[j].key < a[j - 1].key) {
                tmp = a[j];
                a[j] = a[j - 1];
                a[j - 1] = tmp;
            }
        }
    }
}
```
#### 性能分析
- 对于未优化的冒泡排序（没有flag记录是否交换），平均时间复杂度为O(n^2)，稳定的排序算法。
- 对于优化过的冒泡排序（有flag记录是否交换），平均时间复杂度仍然为O(n^2)，不稳定的排序算法。
### 快速排序
- 思路：任选一个（此处选择首个）关键字作为界点，将序列划分成两部分，使得左边部分的所有关键字都小于或等于界点，右边部分的所有关键字都大于或等于界点。
- 然后对两边分别进行递归快速排序。
#### 代码实现
```cpp
template <class KEY, class OTHER>
void quickSort(SET<KEY, OTHER> a[], int low, int high) {
    int mid;
    if (low >= high) return; // 递归终止条件
    mid = divide(a, low, high); // 分割操作
    quickSort(a, low, mid - 1); // 对左半部分递归排序
    quickSort(a, mid + 1, high); // 对右半部分递归排序
}

// 一趟划分的实现
template <class KEY, class OTHER>
int divide(SET<KEY, OTHER> a[], int low, int high) {
    SET<KEY, OTHER> k = a[low]; // 选择基准元素
    do {
        while (low < high && a[high].key >= k.key) --high; // 从右向左找第一个小于k的元素
        if (low < high) a[low++] = a[high]; // 将找到的元素放到左边
        while (low < high && a[low].key <= k.key) ++low; // 从左向右找第一个大于k的元素
        if (low < high) a[high--] = a[low]; // 将找到的元素放到右边
    } while (low != high);
    a[low] = k; // 将基准元素放到正确位置
    return low; // 返回基准元素的位置
}
```
#### 性能分析
- 最坏情况：每次枢纽元素都为最大或最小，时间复杂度为O(n^2)。
```
T(N) = T(N - 1) + cN;
T(N - 1) = T(N - 2) + c(N - 1);
......
T(2) = T(1) + c(2);
推出：
T(N) = T(1) + c(2 + 3 + ... + N) = O(N^2)
```
*改进方法：随机选取界点，或者最左，最右，中间三个元素的中位数作为界点，通常可以避免最坏情况。*
- 最好情况：每次枢纽元素都能将序列分成两半，时间复杂度为O(nlogn)。
```
T(N) = 2T(N / 2) + cN;
T(N) / N = T(N / 2) / (N / 2) + c;
T(N / 2) / (N / 2) = T(N / 4) / (N / 4) + c;
......
T(2) / 2 = T(1) / 1 + c;
推出：
T(N) = cNlogN + N = O(NlogN)
```
- 平均情况：每一个元素都可以当作界点，共n种情况，平均划分为两半，时间复杂度为O(nlogn)，不稳定的算法。
```
T(N) = 2(T(0) + T(1) + ... + T(N - 1)) / N + cN;
T(N) = cNlogN + N = O(NlogN)
```
- 空间复杂度：O(logn)，递归调用栈的深度。
## 5.归并排序
- 思路：将待排序的序列分成两半，分别对两半进行归并排序，然后将两半有序的序列合并成一个有序序列。
- 性能：
   - 最坏时间复杂度：O(nlogn)
   - 平均时间复杂度：O(nlogn)
   - 辅助空间：O(n)，需要额外的空间来存储合并后的结果。
   - 稳定的排序算法。
### 递归实现
```
// 合并两个有序表
template <class KEY, class OTHER>
void merge(SET<KEY, OTHER> a[], int left, int mid, int right) {
    SET<KEY, OTHER> *temp = new SET<KEY, OTHER>[right - left + 1];
    int i = left, j = mid, k = 0;
    
    while (i < mid && j <= right) {
        if (a[i].key < a[j].key) {
            temp[k++] = a[i++];
        } else {
            temp[k++] = a[j++];
        }
    }
    
    while (i < mid) {
        temp[k++] = a[i++];
    }
    while (j <= right) {
        temp[k++] = a[j++];
    }
    
    for (i = 0; k = left; k <= right;) {
        a[k++] = temp[i++];
    }
    delete[] temp; // 释放临时数组
}

// 归并实现
template <class KEY, class OTHER>
void mergeSort(SET<KEY, OTHER> a[], int left, int right) {
    int mid = (left + right) / 2;
    if (left = right) return; // 递归终止条件
    mergeSort(a, left, mid); // 对左半部分进行归并排序
    mergeSort(a, mid + 1, right); // 对右半部分进行归并排序
    merge(a, left, mid + 1, right); // 合并两部分 
}
```
### 非递归实现（仅供参考）
```cpp
template <class KEY, class OTHER>
void mergeSortNonRecursive(SET<KEY, OTHER> a[], int n) {
    // 待排序数组a种a[0]不使用，待排序下标为1到n
    int low = 1; // 被合并的两个表中第一个表的首地址 
    int up; // 被合并的两个表中第二个表的末地址
    int m = 1; // 被合并的两个表中第一个表的长度，初始时为1
    EType* aa;
    aa = new EType[n + 1]; // 用于合并的辅助数组，aa[0]不使用
    while (m < n) {
        up = min(low + 2 * m - 1, n);
        Merge(a, aa, n, low, up, m); // a[low]至a[low + m - 1],a[low + m]至a[up]进行合并
        if (up + m < n) low = up + 1; // up + m >= n说明被合并的另一张表不存在
        else {
            m *= 2;
            low = 1;
        }
    }
    delete[] aa; // 释放辅助数组
}
```
## 6.基数排序（口袋排序法）
- 通过分配的方法对证书进行排序。
- 以排序十进制数为例：
  - 首先将元素按个位数分别放入十个口袋，然后将每个口袋中的元素倒出来；
  - 接着将元素按十位数分别放入十个口袋，然后将每个口袋中的元素倒出来；
  - 再按百位数分配；
  - 到最后一次倒出来时，所有元素就已经排好序了。
### 代码实现
```cpp
// 待排序的元素组成一个不带头结点的单链表；
// 每个口袋也用一个不带头结点的单链表来存储。

template <class OTHER>
struct node {
    SET<int, OTHER> data;
    node* next;
    
    node() : next(nullptr) {}
    node(SET<int, OTHER> d) : data(d), next(nullptr) {}
}

template <class OTHER>
void bucketSort(Node<OTHER> *& p) {
    Node<OTHER> *bucket[10], *last[10], *tail;
    int i, j, k, base = 1, max = 0, len = 0;
    for (tail = p; tail != nullptr; tail = tail->next) {
        if (tail->data.key > max) max = tail->data.key; // 找到最大值
        len++; // 计算长度
    }
    // 找最大键值的位数
    if (max == 0) len = 0;
    else {
        while (max > 0) {
            max /= 10;
            len++;
        }
    }
    for (i = 1; i <= len; i++) {
        for (j = 0; j <= 9; j++) bucket[j] = last[j] = nullptr; // 初始化口袋
        while (p != nullptr) {
            k = (p->data.key / base) % 10; // 取出当前位的数字
            if (bucket[k] == nullptr) {
                bucket[k] = last[k] = p;
            } else {
                last[k] = last[k]->next = p; // 更新尾指针
            }
            p = p->next;
        }
        for (j = 0; j <= 9; j++) {
            if (bucket[j] == nullptr) continue;
            if (p == nullptr) {
                p = bucket[j]; // 将口袋中的元素连接到链表
            } else {
                tail->next = bucket[j]; // 将口袋中的元素连接到链表
            }
            tail = last[j];
        }
        tail->next = nullptr; // 表尾置空
        base *= 10; // 为下一次分配做准备
    }
}
```
### 性能分析
- 空间：所需的额外空间只有10个链表的头尾指针，与排序元素数量无关，空间复杂度为O(1)。
- 时间：(一趟分配+回收)*分配趟数，时间复杂度O(len * (n + 10))，即O(n * len)。其中len为最大键值的位数。稳定的排序算法。
