import type { GameEvent } from '../types';

/** 老年：65 岁以后。人生开始变成一件需要慢慢整理的东西。 */
export const ELDER_EVENTS: readonly GameEvent[] = [
  {
    id: 'grandchild',
    kicker: '六十八岁',
    minAge: 63,
    maxAge: 78,
    weight: 13,
    cond: (s) => s.hasFlag('has_child'),
    text: '孩子把小孩放在你这儿过一个周末，说他们实在太忙了。',
    options: [
      { label: '接下来，好好带', fx: { joy: 12, physique: -5, wealth: -4 }, flags: ['grandparent'], text: '两天下来你腰疼得厉害，但那个小孩叫你的时候，你觉得值。' },
      { label: '说自己身体不行', fx: { joy: -5, charm: -3 }, text: '他们没说什么，第二天就接走了。之后来的次数少了一些。' },
    ],
  },
  {
    id: 'elder-illness',
    kicker: '七十二岁',
    minAge: 66,
    maxAge: 85,
    weight: 12,
    milestone: true,
    text: '一次普通的感冒，拖了三个星期还没好。',
    options: [
      {
        label: '积极配合治疗',
        risk: 62,
        fx: { physique: 6, joy: -2, wealth: -10 },
        fail: { fx: { physique: -14, joy: -6, wealth: -10 }, text: '住院住了两个月。出院的时候你瘦了一圈，走路要扶墙。' },
        text: '恢复得比医生预期的好。你出院那天自己走下了楼。',
      },
      { label: '不想折腾，吃点药算了', fx: { physique: -12, joy: -3, wealth: 4 }, flags: ['stubborn'], text: '你靠自己的办法撑了过去，但身体的底子薄了一层。' },
    ],
  },
  {
    id: 'recall',
    kicker: '七十五岁',
    minAge: 68,
    maxAge: 84,
    weight: 12,
    milestone: true,
    text: '一个很安静的下午，你坐在窗边，忽然把这一生从头到尾过了一遍。',
    options: [
      { label: '承认自己有很多遗憾', fx: { joy: 7, intellect: 4 }, flags: ['reconciled'], text: '你数了数，大概有七八件。奇怪的是数完之后，心里反而松了。' },
      { label: '觉得自己已经尽力了', fx: { joy: 10, charm: 3 }, flags: ['content'], text: '你笑了一下。这句话你以前不太敢说。' },
      { label: '想起了一个很久没见的人', fx: { joy: 4, charm: 4 }, text: '你翻出通讯录，找到那个名字，看了一会儿，又放下了。' },
    ],
  },
  {
    id: 'old-friend-find',
    kicker: '七十岁',
    minAge: 66,
    maxAge: 80,
    weight: 9,
    text: '有人敲你家门，是四十年前一起工作过的人。他说路过，顺便来看看。',
    options: [
      { label: '泡茶，坐下来聊聊', fx: { joy: 10, charm: 4 }, flags: ['nostalgic'], text: '你们聊了四个小时，把当年的人和事一个个说完。' },
      { label: '说不太方便，改天吧', fx: { joy: -4, charm: -3 }, text: '你在窗口看着他走远，忽然想不起他当年坐在哪个位置。' },
    ],
  },
  {
    id: 'learn-new',
    kicker: '七十四岁',
    minAge: 68,
    maxAge: 84,
    weight: 9,
    text: '孙子教你用一个新东西，说了三遍你还是没记住。',
    options: [
      { label: '拿笔记下来，天天练', fx: { intellect: 7, joy: 6, charm: 3 }, flags: ['lifelong_learner'], text: '一个月后你比他还熟。他有点不服气。' },
      { label: '说自己老了学不会', fx: { intellect: -3, joy: -5 }, text: '这句你自己也不太信的话，说出口的时候很顺。' },
    ],
  },
  {
    id: 'will',
    kicker: '八十岁',
    minAge: 76,
    maxAge: 92,
    weight: 10,
    text: '你开始觉得，有些事应该提前写下来。',
    options: [
      { label: '认真立一份遗嘱', fx: { joy: 6, intellect: 3 }, flags: ['prepared'], text: '你在纸上把每个人的名字写完，最后给自己留了一行。' },
      { label: '还早，以后再说', fx: { joy: -3 }, text: '这件事你想了三次，每次都没有开始。' },
    ],
  },
  {
    id: 'elder-quiet',
    kicker: '七十九岁',
    minAge: 72,
    maxAge: 95,
    weight: 8,
    text: '一个傍晚，太阳很好，楼下的孩子在吵，你听着听着睡着了。',
    options: [{ label: '继续', fx: { joy: 4, physique: -2 }, text: '醒来的时候天已经黑了，你有点分不清今天是星期几。' }],
    auto: true,
  },
];
