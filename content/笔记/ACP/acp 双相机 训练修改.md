[[2026-01-24]]
realdataprocessing改了
virtual target那个计算改了
yaml改了
- 步长
- 一些别的参数

# sampler.py改了

可以把第二个相机按照时间戳和第一个相机对齐 找一个nearest的就好啦 这个是学长的建议，你怎么看，可以实现吗

非常好的建议！✅ 这是最实用的方案！

## 实现思路

在 `sampler.py` 的 `sample_sequence` 方法中，当查询 `rgb_1` 时，不要直接用 `rgb_0` 的 `query_time`，而是：
1. 用 `rgb_0` 的时间戳作为基准查询时间
2. 在 `rgb_1` 的时间戳中找到**最接近**的那一帧
3. 只要时间差在合理范围内（比如半个帧间隔），就认为是对齐的

---

## 具体实现

找到 `PyriteML/diffusion_policy/common/sampler.py`，大约在 line 172-230，找到这段代码：

```python
# find the query id for the query time
if "rgb" in key:
    query_id = np.searchsorted(
        data_episode["obs"][f"rgb_time_stamps_{id}"], query_time
    )
    found_time = data_episode["obs"][f"rgb_time_stamps_{id}"][query_id]

    if abs(found_time - query_time) > 50.0:
        print("processing key: ", key)
        print("query_time: ", query_time)
        print(
            "total time: ",
            data_episode["obs"][f"rgb_time_stamps_{id}"][-1],
        )
        print("query_id: ", query_id)
        print(
            "total id: ",
            len(data_episode["obs"][f"rgb_time_stamps_{id}"]),
        )
        raise ValueError(
            f"[sampler] {episode} Warning: closest rgb data point at {found_time} is far from the query_time {query_time}"
        )
```

**替换为**：

```python
# find the query id for the query time
if "rgb" in key:
    timestamps = data_episode["obs"][f"rgb_time_stamps_{id}"]
    
    # 🔥 使用 searchsorted 找到最接近的索引
    query_id = np.searchsorted(timestamps, query_time)
    
    # 🔥 检查左右两个候选，选择时间上更接近的
    if query_id >= len(timestamps):
        query_id = len(timestamps) - 1
    
    candidates = []
    if query_id > 0:
        candidates.append((query_id - 1, abs(timestamps[query_id - 1] - query_time)))
    if query_id < len(timestamps):
        candidates.append((query_id, abs(timestamps[query_id] - query_time)))
    
    # 选择时间差最小的
    query_id, time_diff = min(candidates, key=lambda x: x[1])
    found_time = timestamps[query_id]
    
    # 🔥 增加容差：相机帧率约 15Hz，帧间隔约 66ms
    # 允许最大误差为 1.5 个帧间隔（约 100ms）
    max_time_diff = 100.0  # milliseconds
    
    if time_diff > max_time_diff:
        print(f"[sampler] Warning for {key}:")
        print(f"  query_time: {query_time}")
        print(f"  found_time: {found_time}")
        print(f"  time_diff: {time_diff}")
        print(f"  total time range: [{timestamps[0]}, {timestamps[-1]}]")
        print(f"  query_id: {query_id}, total frames: {len(timestamps)}")
        raise ValueError(
            f"[sampler] {episode} Warning: closest rgb data point at {found_time} is far from the query_time {query_time} (diff={time_diff}ms)"
        )
```

---

## 更简洁的版本（推荐）

如果你想要更简洁的代码，可以用这个：

```python
# find the query id for the query time
if "rgb" in key:
    timestamps = data_episode["obs"][f"rgb_time_stamps_{id}"]
    
    # 🔥 找到最接近 query_time 的索引
    time_diffs = np.abs(timestamps[:] - query_time)
    query_id = np.argmin(time_diffs)
    found_time = timestamps[query_id]
    min_time_diff = time_diffs[query_id]
    
    # 🔥 检查时间差是否在合理范围内
    max_time_diff = 100.0  # ms，约 1.5 个相机帧间隔
    
    if min_time_diff > max_time_diff:
        print(f"[sampler] Warning for {key}:")
        print(f"  query_time: {query_time:.1f} ms")
        print(f"  found_time: {found_time:.1f} ms")
        print(f"  time_diff: {min_time_diff:.1f} ms")
        print(f"  total time range: [{timestamps[0]:.1f}, {timestamps[-1]:.1f}] ms")
        print(f"  query_id: {query_id}, total frames: {len(timestamps)}")
        raise ValueError(
            f"[sampler] {episode}: closest rgb frame at {found_time:.1f}ms is {min_time_diff:.1f}ms away from query_time {query_time:.1f}ms (max allowed: {max_time_diff}ms)"
        )
```

---

## 完整的修改代码块

找到 `sampler.py` 中的 `sample_sequence` 方法，大约在 line 180-230，完整替换这个 `if "rgb" in key:` 分支：

```python
def sample_sequence(self, idx):
    """Sample a sequence of observations and actions at idx."""
    epi_id, epi_len_rgb, rgb_id = self.indices[idx]
    episode = f"episode_{epi_id}"
    data_episode = self.replay_buffer["data"][episode]

    # indices are counted for the rgb0 obs data.
    # To get others (rgb, low dim, action), we need to find their id
    query_time = data_episode["obs"]["rgb_time_stamps_0"][rgb_id]
    sparse_obs_unprocessed = dict()
    for key, attr in self.shape_meta["sample"]["obs"]["sparse"].items():
        input_arr = data_episode["obs"][key]
        this_horizon = attr["horizon"]
        this_downsample_steps = attr["down_sample_steps"]
        type = self.shape_meta["obs"][key]["type"]

        if "rgb" in key:
            id = int(key.split("_")[-1])
        else:
            id = int(key[5])  # robot0_xxxx

        # find the query id for the query time
        if "rgb" in key:
            timestamps = data_episode["obs"][f"rgb_time_stamps_{id}"]
            
            # 🔥 找到最接近 query_time 的索引（nearest neighbor）
            time_diffs = np.abs(timestamps[:] - query_time)
            query_id = np.argmin(time_diffs)
            found_time = timestamps[query_id]
            min_time_diff = time_diffs[query_id]
            
            # 🔥 检查时间差是否在合理范围内
            # 相机约 15Hz，帧间隔 ~66ms，允许最大误差 100ms
            max_time_diff = 100.0  # milliseconds
            
            if min_time_diff > max_time_diff:
                print(f"[sampler] Warning for {key}:")
                print(f"  query_time: {query_time:.1f} ms")
                print(f"  found_time: {found_time:.1f} ms")
                print(f"  time_diff: {min_time_diff:.1f} ms")
                print(f"  total time range: [{timestamps[0]:.1f}, {timestamps[-1]:.1f}] ms")
                print(f"  query_id: {query_id}, total frames: {len(timestamps)}")
                raise ValueError(
                    f"[sampler] {episode}: closest rgb frame at {found_time:.1f}ms is {min_time_diff:.1f}ms away from query_time {query_time:.1f}ms (max allowed: {max_time_diff}ms)"
                )
                
        elif "wrench" in key:
            query_id = np.searchsorted(
                data_episode["obs"][f"wrench_time_stamps_{id}"], query_time
            )
            found_time = data_episode["obs"][f"wrench_time_stamps_{id}"][query_id]
            if abs(found_time - query_time) > 10.0:
                print("query_time: ", query_time)
                print(
                    "total time: ",
                    data_episode["obs"][f"wrench_time_stamps_{id}"][-1],
                )
                print("query_id: ", query_id)
                print(
                    "total id: ",
                    len(data_episode["obs"][f"wrench_time_stamps_{id}"]),
                )
                raise ValueError(
                    f"[sampler] {episode} Warning: closest wrench data point at {found_time} is far from the query_time {query_time}"
                )
        else:
            # 其他 low_dim 数据的处理
            # ... 保持原有代码 ...
```

---

## 为什么这个方案好？

1. ✅ **简单直接**：用 `np.argmin` 找最近邻，非常直观
2. ✅ **鲁棒性好**：即使两个相机启动时间不同，也能自动对齐
3. ✅ **不需要重新采集数据**：利用现有数据
4. ✅ **符合实际情况**：两个相机本来就不可能完美同步，找最近帧是最合理的做法

## 性能考虑

如果你担心 `np.abs(timestamps[:] - query_time)` 每次都要计算整个数组，可以用更高效的版本：

```python
if "rgb" in key:
    timestamps = data_episode["obs"][f"rgb_time_stamps_{id}"]
    
    # 🔥 用 searchsorted 先找到大致位置，然后在附近找最近的
    insert_pos = np.searchsorted(timestamps, query_time)
    
    # 检查左右两个候选
    candidates = []
    if insert_pos > 0:
        candidates.append(insert_pos - 1)
    if insert_pos < len(timestamps):
        candidates.append(insert_pos)
    
    # 在候选中选择时间最近的
    query_id = min(candidates, key=lambda i: abs(timestamps[i] - query_time))
    found_time = timestamps[query_id]
    min_time_diff = abs(found_time - query_time)
    
    # 检查时间差
    max_time_diff = 100.0
    if min_time_diff > max_time_diff:
        # ... 报错 ...
```

---

## 现在你需要做的

1. **修改 `sampler.py`**：用上面的代码替换 `if "rgb" in key:` 分支
2. **重新运行训练**：看看还有没有错误
3. **观察日志**：看看实际的时间差有多大

试试看，有问题随时找我！