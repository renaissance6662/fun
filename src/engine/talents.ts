import type { Origin, Talent } from './types';

/**
 * 天赋：开局三选一。
 * init 是初始属性加成，flags 会在后面几十年的条件判断里反复被用到 ——
 * 这是「天赋真的影响一生」而不是「初始数值高一点」的关键。
 */
export const TALENTS: readonly Talent[] = [
  {
    id: 'bookish',
    name: '书香门第',
    desc: '家里三面墙都是书，你五岁就学会了在饭桌上引用别人。',
    rarity: '常见',
    init: { intellect: 14, wealth: 6, joy: -2 },
    flags: ['bookish'],
  },
  {
    id: 'silver-spoon',
    name: '含着金汤匙',
    desc: '你出生那天，家里讨论的是要不要给你换个更大的房间。',
    rarity: '稀有',
    init: { wealth: 26, charm: 5, physique: -2 },
    flags: ['rich_kid'],
  },
  {
    id: 'beauty',
    name: '天生好看',
    desc: '从小到大，你犯的错都更容易被原谅。',
    rarity: '稀有',
    init: { charm: 18, joy: 3, intellect: -2 },
    flags: ['beauty'],
  },
  {
    id: 'iron-body',
    name: '铁打的身体',
    desc: '流感季节全办公室倒下，只有你还想去打球。',
    rarity: '常见',
    init: { physique: 18, joy: 4 },
    flags: ['tough'],
  },
  {
    id: 'carefree',
    name: '没心没肺',
    desc: '天塌下来你先睡一觉，醒来发现确实没什么大不了。',
    rarity: '常见',
    init: { joy: 20, intellect: -4 },
    flags: ['carefree'],
  },
  {
    id: 'photographic',
    name: '过目不忘',
    desc: '你看过的页码会留在脑子里，代价是它们也删不掉。',
    rarity: '传说',
    init: { intellect: 20, joy: -6 },
    flags: ['genius'],
  },
  {
    id: 'rebel',
    name: '天生反骨',
    desc: '所有「你应该」的句子，在你听来都是一句挑衅。',
    rarity: '稀有',
    init: { intellect: 8, charm: -5, joy: 10 },
    flags: ['rebel'],
  },
  {
    id: 'late-bloomer',
    name: '笨鸟先飞',
    desc: '你不太聪明，但你比别人早起了十年。',
    rarity: '常见',
    init: { intellect: -3, physique: 12, joy: 5 },
    flags: ['diligent'],
  },
  {
    id: 'blessed',
    name: '老天爷赏饭',
    desc: '你做什么都好像比旁边的人顺一点，没人说得清为什么。',
    rarity: '传说',
    init: { intellect: 8, physique: 8, charm: 8, wealth: 8, joy: 8 },
    flags: ['blessed'],
  },
  {
    id: 'ordinary',
    name: '平平无奇',
    desc: '没有任何一项天赋，这本身也是一种稀有的开局。',
    rarity: '常见',
    init: { intellect: 4, physique: 4, charm: 4, wealth: 4, joy: 4 },
    flags: ['ordinary'],
  },
];

export const RARITY_WEIGHT: Record<Talent['rarity'], number> = {
  常见: 10,
  稀有: 3,
  传说: 1,
};

/** 出身：随机，不由玩家选择 —— 这是人生唯一不公平的地方，也是最像人生的地方。 */
export const ORIGINS: readonly Origin[] = [
  {
    id: 'metropolis',
    name: '大城市中产',
    desc: '电梯房，双职工，周末的补习班排得比上班还满。',
    init: { wealth: 10, intellect: 6, joy: -2 },
  },
  {
    id: 'county',
    name: '小县城普通人家',
    desc: '父母在同一个单位，全城的人都认识你妈。',
    init: { wealth: 4, joy: 6, charm: 3 },
  },
  {
    id: 'village',
    name: '乡镇留守',
    desc: '你由爷爷奶奶带大，父母是一年回来一次的陌生人。',
    init: { physique: 10, joy: -6, wealth: -4, intellect: 2 },
  },
  {
    id: 'single-parent',
    name: '单亲家庭',
    desc: '你比同龄人更会看人脸色，也更早学会闭嘴。',
    init: { charm: 8, joy: -5, physique: 3 },
  },
  {
    id: 'merchant',
    name: '生意人家',
    desc: '饭桌上永远在谈钱，你八岁就知道什么叫押账。',
    init: { wealth: 20, charm: 4, joy: -4 },
  },
  {
    id: 'teacher-family',
    name: '教师家庭',
    desc: '你妈教隔壁班，你的每一次考试都有两个人在等结果。',
    init: { intellect: 10, wealth: 2, joy: -3 },
  },
  {
    id: 'urban-village',
    name: '城中村',
    desc: '楼下是修车摊，楼上是麻将声，你在两层噪音之间写完作业。',
    init: { physique: 6, wealth: -2, joy: 4, charm: 3 },
  },
];
