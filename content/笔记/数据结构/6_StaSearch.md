# Part6 静态查找(2025.6.7)
- 静态搜索表：集合中的结点总数是固定的或者很少发生变化。
- 动态搜索表：集合中的结点总数是经常在发生变化。
- 在内存中进行的搜索：重点减少比较、或查找的次数。评价标准：平均搜索长度。
- 在外存中进行的搜索：重点在于减少访问外存的次数。评价标准：读盘次数。
## 1.顺序查找
```cpp
template <class KEY, class OTHER>
int seqSearch(SET<KEY, OTHER> data[], int size, const KEY &x)
{
    data[0].key = x;
    for (int i = size ; x != data[i].key; --i);
    return i;
}
```
- 时间复杂度为O(n)，其中n为数据元素的个数。
- 推导过程注意分为成功和不成功两部分，两种情况概率相等，同时每个结点搜索成功的概率也相等。
## 2.折半查找（二分查找）
```cpp
template <class KEY, class OTHER>
int binarySearch(SET<KEY, OTHER> data[], int size, const KEY &x)
{
    int low = 0, high = size, mid;
    while (low <= high) {
        mid = (low + high) / 2;
        if (data[mid].key == x) return mid;
        else if (data[mid].key < x) low = mid + 1;
        else high = mid - 1;
    }
    return -1; // 未找到
}
```
- 在最坏情况下，二分查找法的查找有序表的最大的比较次数为`1 + int(log(2, n))` ，大体上和`log(2, n)`成正比。
- 平均情况分析（只考虑查找成功的情况下）：平均查找代价为`log(2, n + 1) - 1`。
- 平均情况分析（考虑成功、非成功查找两种的情况下）：平均查找代价为`log(2, n) + 1 / 2`
- 时间复杂度为O(log n)。
## 3.插值查找
- 适用于数据分布比较均匀的情况，可以快速定位。
- 查找位置计算公式：
```
next = low + (high - low + 1) * (x - data[low]) / (data[high] - data[low];
```
- 缺点：计算查找位置比较复杂。
## 4.分块查找
- 它把整个有序表分成若干块，块内的数据元素可以是有序存储，也可以是无序的，但块之间必须是有序的。
- 查找由两个阶段组成：查找索引(有序)和查找块