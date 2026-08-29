const moodResponses = {
  praise: [
    {
      title: '你认真生活的样子，很耀眼',
      message: '不是因为你完成了多少事，而是你一直有自己的温柔、判断和光。今天的你，也已经很好了。',
      action: '请收下一句：我真的很欣赏你。',
    },
    {
      title: '你不需要证明，依然值得偏爱',
      message: '你的可爱不只在开心的时候。疲惫、安静、偶尔没电的你，也同样值得被认真放在心上。',
      action: '今天不打分，只负责喜欢你。',
    },
    {
      title: '我喜欢你身上的小细节',
      message: '是你说到喜欢的事时眼睛会亮，也是你悄悄照顾别人感受的方式。那些细节，我都有看见。',
      action: '晚一点，我要当面再夸你一次。',
    },
  ],
  company: [
    {
      title: '我在，不急着让你变开心',
      message: '你可以慢慢说，也可以什么都不说。我先坐在你身边，陪这阵情绪经过。',
      action: '想聊天就听你说，想安静就陪你待着。',
    },
    {
      title: '今天不用一个人扛',
      message: '如果事情有点多，我们就一件一件来。你不需要先整理好情绪，才值得被陪伴。',
      action: '把最烦的一件事交给我听。',
    },
    {
      title: '先给你一个不催促的拥抱',
      message: '没有“你应该开心一点”，也没有马上解决问题。只有一句：辛苦了，我会认真听。',
      action: '拥抱多久，由你决定。',
    },
  ],
  quiet: [
    {
      title: '批准你暂停营业一会儿',
      message: '消息可以晚点回，计划可以往后放。先把肩膀松下来，喝口水，世界不会因为你休息一下就失去秩序。',
      action: '现在，留十分钟只给自己。',
    },
    {
      title: '不必把每一分钟都过得有用',
      message: '发呆、散步、看窗外，都不是浪费时间。它们是在把你的能量一点点还回来。',
      action: '选一首喜欢的歌，完整听完。',
    },
    {
      title: '今晚把标准调低一点',
      message: '做完最必要的事，就算今天圆满。剩下的交给明天，今天的你该被好好接住。',
      action: '洗个热水澡，然后早点睡。',
    },
  ],
  sweet: [
    {
      title: '今天的甜，应该有你的名字',
      message: '去吃那份惦记很久的小甜点吧。开心不必宏大，一口喜欢的味道就可以是今天的小小庆祝。',
      action: '甜品我请，你负责挑最想吃的。',
    },
    {
      title: '给普通的一天加一点糖',
      message: '可以是一杯热饮、一束小花，或绕路去看一次晚霞。被认真安排的小事，会让日子重新发亮。',
      action: '选一样，我陪你去。',
    },
    {
      title: '有一份限定好心情正在派送',
      message: '里面装着你喜欢的口味、一次不赶时间的散步，还有今天份额外的偏心。',
      action: '领取方式：告诉我你现在最想要什么。',
    },
  ],
};

const bloomStages = [
  { stage: 0, label: '花苞在等你' },
  { stage: 1, label: '长出一点勇气' },
  { stage: 2, label: '为你开好啦' },
];

const candyMessages = [
  '你不用一直懂事，也可以被好好照顾。',
  '今天辛苦了，先把世界调成静音一会儿。',
  '你认真生活的样子，本身就很闪亮。',
  '坏心情只是路过，不代表你不够好。',
  '哪怕只有一点点开心，那一点点也很珍贵。',
  '允许自己慢一点，花也不是一夜盛开的。',
];

export function getMoodResponse(mood, index = 0) {
  const responses = moodResponses[mood] ?? moodResponses.company;
  const safeIndex = Math.abs(Number(index) || 0) % responses.length;
  return responses[safeIndex];
}

export function getNextMessage(mood, currentIndex = 0) {
  return getMoodResponse(mood, Number(currentIndex) + 1);
}

export function normalizeRecipient(value) {
  const cleaned = String(value ?? '').trim().replace(/\s+/g, ' ');
  return cleaned.slice(0, 12) || '你';
}

export function getBloomStage(stage = 0) {
  const safeStage = Math.min(Math.max(Number(stage) || 0, 0), bloomStages.length - 1);
  return bloomStages[safeStage];
}

export function getCandyMessage(index = 0) {
  const safeIndex = Math.abs(Number(index) || 0) % candyMessages.length;
  return candyMessages[safeIndex];
}

function initializeHappySpace(doc = document) {
  const moodButtons = [...doc.querySelectorAll('[data-mood]')];
  const responseCard = doc.querySelector('[data-response-card]');
  const responseTitle = doc.querySelector('[data-response-title]');
  const responseMessage = doc.querySelector('[data-response-message]');
  const responseAction = doc.querySelector('[data-response-action]');
  const responseKicker = doc.querySelector('.response-kicker');
  const nextButton = doc.querySelector('[data-next-message]');
  const nameTrigger = doc.querySelector('[data-name-trigger]');
  const namePanel = doc.querySelector('#name-panel');
  const nameForm = doc.querySelector('[data-name-form]');
  const nameInput = doc.querySelector('#recipient-name');
  const recipientSlots = [...doc.querySelectorAll('[data-recipient]')];
  const ticketStatus = doc.querySelector('[data-ticket-status]');
  const openGiftButton = doc.querySelector('[data-open-gift]');
  const giftStage = doc.querySelector('[data-gift-stage]');
  const giftContent = doc.querySelector('[data-gift-content]');
  const bloomCard = doc.querySelector('[data-bloom-card]');
  const bloomLabel = doc.querySelector('[data-bloom-label]');
  const growFlowerButton = doc.querySelector('[data-grow-flower]');
  const candyButton = doc.querySelector('[data-candy-button]');
  const candyMessage = doc.querySelector('[data-candy-message]');
  let currentMood = 'company';
  let currentIndex = 0;
  let bloomStage = 0;
  let candyIndex = 0;

  const renderResponse = (mood, index) => {
    const response = getMoodResponse(mood, index);
    responseTitle.textContent = response.title;
    responseMessage.textContent = response.message;
    responseAction.textContent = response.action;
    responseKicker.textContent = '这一句，只说给此刻的你';
    nextButton.hidden = false;
    responseCard.classList.remove('is-changing');
    window.requestAnimationFrame(() => responseCard.classList.add('is-changing'));
  };

  moodButtons.forEach((button) => {
    button.addEventListener('click', () => {
      currentMood = button.dataset.mood;
      currentIndex = 0;
      moodButtons.forEach((item) => item.setAttribute('aria-pressed', String(item === button)));
      renderResponse(currentMood, currentIndex);
      responseCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  nextButton?.addEventListener('click', () => {
    currentIndex += 1;
    renderResponse(currentMood, currentIndex);
  });

  openGiftButton?.addEventListener('click', () => {
    giftStage.classList.add('is-open');
    openGiftButton.disabled = true;
    openGiftButton.querySelector('span').textContent = '礼物已经签收啦';
    const revealDelay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650;
    window.setTimeout(() => {
      giftContent.hidden = false;
      doc.body.classList.remove('gift-closed');
      giftContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, revealDelay);
  });

  growFlowerButton?.addEventListener('click', () => {
    bloomStage = Math.min(bloomStage + 1, 2);
    const state = getBloomStage(bloomStage);
    bloomCard.dataset.stage = String(state.stage);
    bloomLabel.textContent = state.label;
    if (state.stage === 2) {
      growFlowerButton.textContent = '这朵花送给你  ✦';
      growFlowerButton.disabled = true;
    }
  });

  candyButton?.addEventListener('click', () => {
    candyMessage.textContent = getCandyMessage(candyIndex);
    candyIndex += 1;
    candyButton.innerHTML = '再拆一颗 <span aria-hidden="true">✦</span>';
  });

  const setRecipient = (value) => {
    const recipient = normalizeRecipient(value);
    recipientSlots.forEach((slot) => { slot.textContent = recipient; });
    nameInput.value = recipient === '你' ? '' : recipient;
    return recipient;
  };

  const initialRecipient = new URL(window.location.href).searchParams.get('to');
  if (initialRecipient) setRecipient(initialRecipient);

  nameTrigger?.addEventListener('click', () => {
    const willOpen = namePanel.hidden;
    namePanel.hidden = !willOpen;
    nameTrigger.setAttribute('aria-expanded', String(willOpen));
    if (willOpen) window.requestAnimationFrame(() => nameInput.focus());
  });

  nameForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const recipient = setRecipient(nameInput.value);
    const url = new URL(window.location.href);
    if (recipient === '你') url.searchParams.delete('to');
    else url.searchParams.set('to', recipient);
    window.history.replaceState({}, '', url);
    namePanel.hidden = true;
    nameTrigger.setAttribute('aria-expanded', 'false');
    nameTrigger.focus();
  });

  doc.querySelectorAll('[data-ticket]').forEach((ticket) => {
    ticket.addEventListener('click', () => {
      const kept = ticket.classList.toggle('is-kept');
      ticket.setAttribute('aria-pressed', String(kept));
      ticket.querySelector('.ticket-cut').textContent = kept ? '已收好' : '收下';
      ticketStatus.textContent = kept
        ? `“${ticket.dataset.ticket}”许可券已经放进你的口袋。需要时，随时拿出来。`
        : '许可券放回原处了。想要的时候，还可以再收下。';
    });
  });
}

if (typeof document !== 'undefined') {
  initializeHappySpace();
}
