import type { GameEvent } from '../types';

/** 不分年龄的通用事件，用来填满人生的随机性。 */
export const COMMON_EVENTS: readonly GameEvent[] = [
  {
    id: 'found-money',
    minAge: 8,
    maxAge: 90,
    weight: 7,
    auto: true,
    text: '你在路上捡到一个钱包。',
    options: [
      { label: '继续', fx: { joy: 4 }, text: '里面有三百块现金和一张身份证。你交给了楼下保安，心情好了一整天。' },
    ],
  },
  {
    id: 'lottery',
    minAge: 18,
    maxAge: 85,
    weight: 8,
    text: '楼下彩票店挂出横幅，说这一期奖池累积到了很高的数。',
    options: [
      {
        label: '买一张试试',
        risk: 4,
        fx: { wealth: 60, joy: 16 },
        fail: { fx: { wealth: -1, joy: -1 }, text: '没中。你把票根顺手夹进了一本书里。' },
        text: '中了一笔不小的钱。你第一反应是反复核对那串数字，第二反应是不知道该告诉谁。',
        flags: ['lucky_win'],
      },
      { label: '不买，概率太低', fx: { wealth: 1, intellect: 2 }, text: '你算了一下期望值，然后走开了。' },
    ],
  },
  {
    id: 'meteor',
    minAge: 6,
    maxAge: 88,
    weight: 5,
    auto: true,
    text: '半夜你正好抬头，看到一颗流星划过。',
    options: [{ label: '继续', fx: { joy: 5 }, text: '你想起有人说过要许愿，但你想了很久也没想起自己要许什么。' }],
  },
  {
    id: 'stranger-help',
    minAge: 16,
    maxAge: 80,
    weight: 7,
    text: '雨天，一位老人摔倒在你前面不远处，周围没有人停下来。',
    options: [
      { label: '上去扶，并叫救护车', fx: { charm: 6, wealth: -3, joy: 5 }, flags: ['just'], text: '家属赶来时一直道谢。你回家的路上雨停了。' },
      { label: '先拍视频留证再扶', fx: { intellect: 5, charm: 3, joy: 2 }, text: '老人说，你这样是对的，别怪自己。' },
      { label: '绕开走', fx: { joy: -6, intellect: 2 }, text: '你走了两步回头看，已经有人过去了。' },
    ],
  },
  {
    id: 'reunion-old-place',
    minAge: 25,
    maxAge: 75,
    weight: 6,
    auto: true,
    text: '你路过一个很久没去过的地方。',
    options: [
      { label: '继续', fx: { joy: 3, intellect: 2 }, text: '原来的店没了，换了招牌，但门口那棵树的形状一点没变。' },
    ],
  },
];

/**
 * 平淡的一年。
 *
 * 事件池总会抽干 —— 尤其是高年龄段的窗口很窄。
 * 这就是我在方案里说的「规则兜底」：宁可这一年什么都没发生，也不能让游戏卡住。
 */
export const FILLER_EVENTS: readonly GameEvent[] = [
  { id: 'fill-1', auto: true, weight: 10, text: '这一年没什么大事发生。', options: [{ label: '继续', fx: { joy: 1 }, text: '日子一页一页翻过去，你甚至想不起其中任何一天。' }] },
  { id: 'fill-2', auto: true, weight: 10, text: '一切都在正常的轨道上。', options: [{ label: '继续', fx: { wealth: 2 }, text: '该上班上班，该吃饭吃饭，工资涨了一点点。' }] },
  { id: 'fill-3', auto: true, weight: 10, text: '这一年过得很快。', options: [{ label: '继续', fx: { physique: -1 }, text: '翻日历的时候你愣了一下，又一年过完了。' }] },
  { id: 'fill-4', auto: true, weight: 8, text: '你去了一趟外地，见了几个不算熟的人。', options: [{ label: '继续', fx: { charm: 2, joy: 2 }, text: '回来的高铁上你睡了一路。' }] },
  { id: 'fill-5', auto: true, weight: 8, text: '家里换了新的一些东西。', options: [{ label: '继续', fx: { joy: 2, wealth: -2 }, text: '新沙发比旧的硬，你还不太习惯。' }] },
  { id: 'fill-6', auto: true, weight: 8, text: '你重新开始看一本书，看了三分之一又停下了。', options: [{ label: '继续', fx: { intellect: 2 }, text: '书签一直停在那一页。' }] },
  { id: 'fill-7', auto: true, weight: 7, text: '和几个老朋友吃了顿饭。', options: [{ label: '继续', fx: { joy: 3, charm: 1 }, text: '话题从工作慢慢变成了身体。' }] },
  { id: 'fill-8', auto: true, weight: 7, text: '你身上多了一处小毛病。', options: [{ label: '继续', fx: { physique: -2, joy: -1 }, text: '不严重，但它在提醒你什么。' }] },
  { id: 'fill-9', auto: true, weight: 6, text: '这一年你赚了一点，也花掉了一点。', options: [{ label: '继续', fx: { wealth: 3, joy: 1 }, text: '账本上的数字变化不大。' }] },
  { id: 'fill-10', auto: true, weight: 6, text: '有件事你想做，但一直没做。', options: [{ label: '继续', fx: { joy: -2, intellect: 1 }, text: '它现在还躺在你的备忘录里。' }] },
];
