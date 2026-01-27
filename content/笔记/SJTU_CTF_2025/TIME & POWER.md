Please input your password (all in lowercase letters): staticmanifest
Checking...(14/14)
Wrong password.

在3/14和8/14处卡顿，说明长度是对的，你生成的密码符合认证密码的某些特征，请继续尝试stbticmbnifes

staticmanifest

stringmanifest

dynamicmanifest

staticmanifest

filemanagement
在6和8处卡顿

applicationurl
在1和7处卡顿

applicationweb
在1和7处卡顿

---

authatastorage
在1，5，7处卡顿

apidataservice
还是在1，5，7处卡顿

前10位为a
aaaaaaaaaa

11位为d
aaaaaaaaaad

aaaaaaaaaadmia
13位为i
a 1
d 4
i 9
m 13

12位为m

aaaaaaaaaadmib

aaaaaaaaaadmic

aaaaaaaaaadmid

aaaaaaaaaadmie

aaaaaaaaaadmif

aaaaaaaaaadmig

aaaaaaaaaadmih

aaaaaaaaaadmii

aaaaaaaaaadmij

aaaaaaaaaadmik

aaaaaaaaaadmil

aaaaaaaaaadmin

我怎么就忘了admin这个词呀

## 3. 对于已经显示的内容

如果输出已经在屏幕上但不完整：

bash

```
# 使用script命令记录新会话
script output.txt
# 然后重新运行你的命令
# 完成后输入exit
```

使用python从文件中读取数据，然后base64解码，再输出到另一个文件中

他妈的，原汤化原食，需要在Linux下base64 -d input.txt > data.npz，而不要把input.txt解码成output.txt再改后缀，我是笨蛋，baka

每个子数组中有100个元素，只有一个值大于11，不对，有的数组没有大于11的元素，这下坏了

input_id_array中元素个数和power_array中子数组个数相同，都为1053个

input_id_array中值从0到26，和英文字母个数同，但是input_array中还有数字和字符，input_array的周期是27，和id array中0-26数目同

input_array中元素也为1053个

id array中每个数字出现39次

我现在有3个数组

第一个数组，input_array，里面有1053个字符，由27个从a到z加0到9加几个特殊字符组成，
27个含39个字符的集合

第二个数组，input_id_array，里面有1053个数字，分别是39个0到39个9
27个含39个数字的集合

第三个数组，power_array，里面有1053个子集，每个子集里有100个数据，已经给定

需要建立3个数组间元素的对应关系

power_array里第i个子集，对应input_id_array里第i个数字，对应input_array里第i个字符？

需要知道input_array里字符按照什么顺序排序

参见[[2025-04-03]]

```
批次 | 方差最大的子集编号 | 方差最小的子集编号
----|-----------------|----------------
   1 |                 26 |                 27
   2 |                 73 |                 40
   3 |                103 |                106
   4 |                121 |                140
   5 |                178 |                187
   6 |                228 |                210
   7 |                246 |                235
   8 |                280 |                276
   9 |                332 |                313
  10 |                371 |                369
  11 |                415 |                427
  12 |                459 |                432
  13 |                505 |                469
  14 |                535 |                544
  15 |                563 |                547
  16 |                606 |                586
  17 |                663 |                647
  18 |                669 |                700
  19 |                707 |                727
  20 |                763 |                768
  21 |                786 |                781
  22 |                830 |                820
  23 |                884 |                872
  24 |                900 |                929
  25 |                965 |                937
  26 |                993 |                979
  27 |               1033 |               1015
```


26 
34

