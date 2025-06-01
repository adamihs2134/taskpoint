// --- 初期データロード ---
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let luxuryItems = JSON.parse(localStorage.getItem('luxuryItems')) || [];
let pointHistory = JSON.parse(localStorage.getItem('pointHistory')) || [];
let pointTotal = parseInt(localStorage.getItem('pointTotal')) || 0;
let luxuryPoint = parseInt(localStorage.getItem('luxuryPoint')) || 0;
let currentDate = new Date();

// --- DOM要素取得 ---
const $ = id => document.getElementById(id);
const todayTaskList = $('today-task-list');
const taskForm = $('task-form');
const taskInput = $('task-input');
const pointInput = $('point-input');
const dateInput = $('date-input');
const repeatInput = $('repeat-input');
const repeatType = $('repeat-type');
const repeatInterval = $('repeat-interval');
const pointTotalElem = $('point-total');
const luxuryPointElem = $('luxury-point');
const calendarDiv = $('calendar');
const luxuryItemsList = $('luxury-items');
const luxuryForm = $('luxuryForm');
const luxuryItemNameInput = $('luxury-item-name');
const luxuryItemCostInput = $('luxury-item-cost');
const pointHistoryList = $('point-history-list');
const exchangeButton = $('exchange-button');
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// --- タブ切り替え ---
tabs.forEach(tab => {
  tab.addEventListener('click', () => {
    tabs.forEach(t => t.classList.remove('active'));
    tabContents.forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    $(tab.dataset.tab).classList.add('active');
  });
});

// --- サブタブ切り替え ---
document.querySelectorAll('.subtab').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.subtab').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll('.history-list').forEach(list => list.style.display = 'none');
    $(btn.dataset.subtab).style.display = '';
  });
});

// --- 保存処理 ---
function saveAll() {
  localStorage.setItem('tasks', JSON.stringify(tasks));
  localStorage.setItem('luxuryItems', JSON.stringify(luxuryItems));
  localStorage.setItem('pointHistory', JSON.stringify(pointHistory));
  localStorage.setItem('pointTotal', pointTotal);
  localStorage.setItem('luxuryPoint', luxuryPoint);
  renderTaskList();
  updatePointHistory();
}

// --- ポイント表示更新 ---
function updatePoints() {
  pointTotalElem.textContent = pointTotal;
  luxuryPointElem.textContent = luxuryPoint;
  // 常に黒
  luxuryPointElem.style.background = 'none';
  luxuryPointElem.style.backgroundClip = 'border-box';
  luxuryPointElem.style.webkitBackgroundClip = 'border-box';
  luxuryPointElem.style.webkitTextFillColor = '#000';
  luxuryPointElem.style.color = '#000';
  luxuryPointElem.style.fontWeight = 'bold';
  luxuryPointElem.style.animation = '';
}

// --- パチンコ風カラー ---
function getPachinkoColor(val) {
  if (val >= 100) return 'linear-gradient(90deg, red, orange, yellow, green, blue, indigo, violet)';
  if (val >= 80) return '#FFD700';
  if (val >= 60) return '#e53935';
  if (val >= 40) return '#43a047';
  if (val >= 20) return '#1e88e5';
  return '#111';
}

// --- 連続達成ボーナス用の補助関数 ---
function getStreak(task) {
  // 連続達成日数を計算
  if (!task.lastDoneDate || !task.doneHistory) return 0;
  let streak = 0;
  let date = new Date(task.lastDoneDate);
  for (let i = task.doneHistory.length - 1; i >= 0; i--) {
    if (!task.doneHistory[i]) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

// --- 今日のタスク表示 ---
function updateTodayTasks() {
  todayTaskList.innerHTML = '';
  const todayStr = (new Date()).toISOString().slice(0, 10);
  let hasTask = false;
  tasks.forEach((task, idx) => {
    // まだ開始前の日付ならスキップ
    if (task.date > todayStr) return;
    if (isTaskForToday(task, todayStr)) {
      hasTask = true;
      const alreadyDoneToday = task.lastDoneDate === todayStr;
      const li = document.createElement('li');
      li.style.display = 'flex';
      li.style.alignItems = 'center';
      li.style.flexDirection = 'column';
      li.style.position = 'relative';

      // 上段：横並び
      const row = document.createElement('div');
      row.style.display = 'flex';
      row.style.alignItems = 'center';
      row.style.width = '100%';

      // チェックボックス
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.checked = !!task.doneToday;
      checkbox.disabled = alreadyDoneToday;
      checkbox.className = 'task-checkbox';

      // タスク名（左詰め）
      const nameSpan = document.createElement('span');
      nameSpan.textContent = task.name;
      nameSpan.className = 'task-name';
      nameSpan.style.flex = '1';
      nameSpan.style.textAlign = 'left';
      nameSpan.style.fontWeight = 'bold';
      if (task.doneToday) nameSpan.classList.add('done');

      // 右側ラッパー
      const rightWrapper = document.createElement('span');
      rightWrapper.style.display = 'flex';
      rightWrapper.style.alignItems = 'center';
      rightWrapper.style.marginLeft = 'auto';

      // ポイント
      const pointSpan = document.createElement('span');
      pointSpan.textContent = `${task.point}pt`;
      pointSpan.className = 'task-point';

      // 三点リーダー
      const menuButton = document.createElement('button');
      menuButton.textContent = '︙';
      menuButton.className = 'menu-btn';

      // メニュー
      const menu = createMenu({
        menuClass: 'task-menu',
        onEdit: e => {
          e.stopPropagation();
          if (alreadyDoneToday) {
            menu.style.display = 'none';
            alert('完了したタスクは編集できません');
            return;
          }
          menu.style.display = 'none';
          taskInput.value = task.name;
          pointInput.value = task.point;
          dateInput.value = task.date;
          repeatInput.checked = task.repeat;
          tasks.splice(idx, 1);
          saveAll();
          updateTodayTasks();
          renderCalendar();
          tabs.forEach(t => t.classList.remove('active'));
          tabContents.forEach(c => c.classList.remove('active'));
          document.querySelector('[data-tab="tab-task-add"]').classList.add('active');
          $('tab-task-add').classList.add('active');
        },
        onDelete: e => {
          e.stopPropagation();
          menu.style.display = 'none';
          if(confirm(`タスク「${task.name}」を削除しますか？`)){
            tasks.splice(idx, 1);
            saveAll();
            updateTodayTasks();
            renderCalendar();
          }
        }
      });
      menuButton.addEventListener('click', e => {
        e.stopPropagation();
        document.querySelectorAll('.context-menu').forEach(m => { if(m!==menu) m.style.display='none'; });
        menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
      });
      document.addEventListener('click', () => { menu.style.display = 'none'; });

      rightWrapper.append(pointSpan, menuButton, menu);
      row.append(checkbox, nameSpan, rightWrapper);

      // ボーナスバー（今日のタスクのみ）
      let streakCount = 0;
      let bonusTarget = 0;
      let barColor = '#81c784';
      if (!task.doneHistory) task.doneHistory = [];

      // streakCountは「連続でチェックした日数」だけカウント
      if (task.repeatType === 'weekday' || task.repeatType === 'everyday') {
        // 直近から逆順で連続しているdone=trueの日付をカウント
        for (let i = task.doneHistory.length - 1; i >= 0; i--) {
          const entry = task.doneHistory[i];
          if (!entry || !entry.done) break;
          // 連続かどうか判定
          if (streakCount === 0) {
            streakCount = 1;
          } else {
            const prevDate = new Date(task.doneHistory[i + 1].date);
            prevDate.setDate(prevDate.getDate() - 1);
            if (entry.date === prevDate.toISOString().slice(0, 10)) {
              streakCount++;
            } else {
              break;
            }
          }
        }
        if (task.repeatType === 'weekday') {
          bonusTarget = 5;
          barColor = '#42a5f5';
        } else if (task.repeatType === 'everyday') {
          bonusTarget = 7;
          barColor = '#ffb300';
        }
      }

      // ボーナスバーの表示条件
      let showBonusBar = false;
      if (bonusTarget > 0 && streakCount < bonusTarget && streakCount > 0) {
        showBonusBar = true;
      }

      const barWrapper = document.createElement('div');
      if (showBonusBar) {
        barWrapper.style.width = '100%';
        barWrapper.style.margin = '6px 0 0 0';
        barWrapper.style.display = 'flex';
        barWrapper.style.alignItems = 'center';
        barWrapper.style.gap = '8px';

        const bar = document.createElement('div');
        bar.style.flex = '1';
        bar.style.height = '12px';
        bar.style.background = '#eee';
        bar.style.borderRadius = '6px';
        bar.style.overflow = 'hidden';
        bar.style.position = 'relative';
        bar.style.maxWidth = '120px';

        const fill = document.createElement('div');
        fill.style.height = '100%';
        fill.style.width = `${Math.min(streakCount, bonusTarget) / bonusTarget * 100}%`;
        fill.style.background = barColor;
        fill.style.borderRadius = '6px';
        fill.style.transition = 'width 0.3s';

        bar.appendChild(fill);

        const barText = document.createElement('span');
        barText.style.fontSize = '0.9em';
        barText.style.marginLeft = '8px';
        barText.style.color = '#666';
        barText.textContent = `あと${bonusTarget - streakCount}日`;

        barWrapper.append(bar, barText);
      }

      li.append(row);
      if (showBonusBar) li.append(barWrapper);
      todayTaskList.appendChild(li);

      // チェック切替
      checkbox.addEventListener('change', () => {
        if (checkbox.checked && !task.doneToday && !alreadyDoneToday) {
          task.doneToday = true;
          task.lastDoneDate = todayStr;
          if (!task.doneHistory) task.doneHistory = [];
          task.doneHistory.push({ date: todayStr, done: true });

          // ボーナス判定
          let streakCount = 0;
          // 直近から逆順で連続しているdone=trueの日付をカウント
          for (let i = task.doneHistory.length - 1; i >= 0; i--) {
            const entry = task.doneHistory[i];
            if (!entry || !entry.done) break;
            if (streakCount === 0) {
              streakCount = 1;
            } else {
              const prevDate = new Date(task.doneHistory[i + 1].date);
              prevDate.setDate(prevDate.getDate() - 1);
              if (entry.date === prevDate.toISOString().slice(0, 10)) {
                streakCount++;
              } else {
                break;
              }
            }
          }
          let bonus = 0;
          if (task.repeatType === 'weekday' && streakCount === 5) {
            bonus = task.point * 2;
          }
          if (task.repeatType === 'everyday' && streakCount === 7) {
            bonus = task.point * 2;
            // 7日連続達成後は履歴をリセット（最新1件だけ残す）
            task.doneHistory = [task.doneHistory[task.doneHistory.length - 1]];
          }
          pointTotal += task.point;
          if (bonus > 0) {
            pointTotal += bonus;
            pointHistory.push({
              type: 'ボーナス',
              detail: `タスク「${task.name}」連続達成ボーナス`,
              amount: bonus,
              date: new Date().toISOString(),
            });
            alert(`連続達成ボーナス！+${bonus}pt`);
          }
          pointHistory.push({
            type: '獲得',
            detail: `タスク「${task.name}」達成`,
            amount: task.point,
            date: new Date().toISOString(),
          });
          updatePoints();
          saveAll();
          updateTodayTasks();
        } else if (!checkbox.checked && task.doneToday && !alreadyDoneToday) {
          task.doneToday = false;
          task.lastDoneDate = null;
          if (task.doneHistory && task.doneHistory.length > 0) {
            task.doneHistory.pop();
          }
          pointTotal -= task.point;
          pointHistory.push({
            type: '取消',
            detail: `タスク「${task.name}」完了取消`,
            amount: -task.point,
            date: new Date().toISOString(),
          });
          updatePoints();
          saveAll();
          updateTodayTasks();
        }
      });
    }
  });
  // タスクがなければメッセージ表示
  if (!hasTask) {
    const li = document.createElement('li');
    li.textContent = 'タスクを追加しよう！';
    li.style.textAlign = 'center';
    li.style.justifyContent = 'center';
    li.style.width = '100%';
    todayTaskList.appendChild(li);
  }
}

// --- カレンダー ---
function updateCalendar() {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  $("current-month").textContent = `${year}年${month + 1}月`;
  renderCalendar(year, month);
}
$("prev-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() - 1);
  updateCalendar();
});
$("next-month").addEventListener("click", () => {
  currentDate.setMonth(currentDate.getMonth() + 1);
  updateCalendar();
});
function renderCalendar(year = currentDate.getFullYear(), month = currentDate.getMonth()) {
  calendarDiv.innerHTML = '';
  const daysOfWeek = ['日','月','火','水','木','金','土'];
  daysOfWeek.forEach(d => {
    const div = document.createElement('div');
    div.textContent = d;
    div.style.fontWeight = 'bold';
    div.style.backgroundColor = '#c8e6c9';
    calendarDiv.appendChild(div);
  });
  const firstDay = new Date(year, month, 1);
  const startDay = firstDay.getDay();
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  for(let i=0; i<startDay; i++){
    calendarDiv.appendChild(document.createElement('div'));
  }
  for(let day=1; day<=daysInMonth; day++){
    const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const div = document.createElement('div');
    div.textContent = day;
    if (dateStr === (new Date()).toISOString().slice(0,10)) div.classList.add('today');
    div.addEventListener('click', () => {
      dateInput.value = dateStr;
      tabs.forEach(t => t.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));
      document.querySelector('[data-tab="tab-task-add"]').classList.add('active');
      $('tab-task-add').classList.add('active');
    });
    calendarDiv.appendChild(div);
  }
}

// --- タスク追加 ---
repeatType.addEventListener('change', () => {
  if (repeatType.value === 'interval') {
    repeatInterval.style.display = 'block';
  } else {
    repeatInterval.style.display = 'none';
  }
});

taskForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = taskInput.value.trim();
  const point = parseInt(pointInput.value);
  const date = dateInput.value;
  const endDate = document.getElementById('end-date-input').value || null;
  let repeat = repeatType.value !== 'none';
  let repeatTypeVal = repeatType.value;
  let repeatIntervalVal = repeatType.value === 'interval' ? parseInt(repeatInterval.value) : null;

  // 終了日時が開始日時より前の場合はエラー
  if (endDate && date && endDate < date) {
    alert('開始日時以降の日付を入力してください');
    return;
  }

  if (!name || !point || !date) return alert('全て入力してください');
  if (repeatTypeVal === 'interval' && (!repeatIntervalVal || repeatIntervalVal < 1)) {
    return alert('間隔を正しく入力してください');
  }
  tasks.push({
    name, point, date, endDate, repeat,
    repeatType: repeatTypeVal,
    repeatInterval: repeatIntervalVal,
    doneToday: false,
    lastDoneDate: null
  });
  taskInput.value = '';
  pointInput.value = '';
  dateInput.value = '';
  document.getElementById('end-date-input').value = '';
  repeatType.value = 'none';
  repeatInterval.value = '';
  repeatInterval.style.display = 'none';
  saveAll();
  updateTodayTasks();
  renderCalendar();
  renderTaskList();
});

// --- キャンセルボタン ---
$('task-cancel-btn').addEventListener('click', () => {
  taskInput.value = '';
  pointInput.value = '';
  dateInput.value = '';
  repeatInput.checked = false;
});

// --- メニュー生成 ---
function createMenu({ onEdit, onDelete, menuClass = '' }) {
  const menu = document.createElement('div');
  menu.className = menuClass + ' context-menu';
  menu.style.display = 'none';
  menu.style.position = 'absolute';
  menu.style.right = '0';
  menu.style.top = '100%';
  menu.style.backgroundColor = '#fff';
  menu.style.border = '1px solid #ccc';
  menu.style.padding = '0';
  menu.style.zIndex = '1000'; // ← z-indexを大きく
  menu.style.minWidth = '80px';
  menu.style.flexDirection = 'column';
  menu.style.boxShadow = '0 2px 8px rgba(0,0,0,0.15)';

  // ボタンをdivからbuttonに変更し、クリックしやすく
  const editBtn = document.createElement('button');
  editBtn.textContent = '編集';
  editBtn.className = 'menu-edit';
  editBtn.style.width = '100%';
  editBtn.style.padding = '8px 0';
  editBtn.style.border = 'none';
  editBtn.style.background = 'none';
  editBtn.style.cursor = 'pointer';
  editBtn.addEventListener('click', onEdit);

  const deleteBtn = document.createElement('button');
  deleteBtn.textContent = '削除';
  deleteBtn.className = 'menu-delete';
  deleteBtn.style.width = '100%';
  deleteBtn.style.padding = '8px 0';
  deleteBtn.style.border = 'none';
  deleteBtn.style.background = 'none';
  deleteBtn.style.cursor = 'pointer';
  deleteBtn.addEventListener('click', onDelete);

  menu.append(editBtn, deleteBtn);
  return menu;
}

// --- 贅沢アイテム表示 ---
function updateLuxuryItems() {
  luxuryItemsList.innerHTML = '';
  [...luxuryItems].sort((a, b) => a.cost - b.cost).forEach((item, idx) => {
    const li = document.createElement('li');
    li.style.display = 'flex';
    li.style.alignItems = 'center';
    li.style.padding = '12px 8px';
    li.style.borderBottom = '1px solid #eee';
    li.style.background = idx % 2 === 0 ? '#fafafa' : '#fff';
    // アイテム名
    const leftSpan = document.createElement('span');
    leftSpan.textContent = item.name;
    leftSpan.style.flex = '1';
    leftSpan.style.fontWeight = 'bold';
    leftSpan.style.fontSize = '1.1em';
    leftSpan.style.overflow = 'hidden';
    leftSpan.style.textOverflow = 'ellipsis';
    leftSpan.style.whiteSpace = 'nowrap';
    // 必要ポイント
    const pointSpan = document.createElement('span');
    pointSpan.textContent = `${item.cost}pt`;
    pointSpan.className = 'luxury-cost-badge';
    pointSpan.style.marginLeft = '16px';
    pointSpan.style.marginRight = '8px';
    pointSpan.style.fontSize = '1.1em';
    pointSpan.style.fontWeight = 'bold';
    pointSpan.style.padding = '4px 14px';
    pointSpan.style.borderRadius = '16px';
    pointSpan.style.minWidth = '60px';
    pointSpan.style.textAlign = 'center';
    // 色付け
    const color = getPachinkoColor(item.cost);
    if (item.cost >= 100) {
      pointSpan.style.background = color;
      pointSpan.style.backgroundClip = 'text';
      pointSpan.style.webkitBackgroundClip = 'text';
      pointSpan.style.webkitTextFillColor = 'transparent';
      pointSpan.style.color = '#FFD700';
      pointSpan.style.animation = 'rainbow-glow 1.5s linear infinite';
      pointSpan.style.border = 'none';
    } else {
      pointSpan.style.background = '#fff';
      pointSpan.style.backgroundClip = 'border-box';
      pointSpan.style.webkitBackgroundClip = 'border-box';
      pointSpan.style.webkitTextFillColor = color;
      pointSpan.style.color = color;
      pointSpan.style.animation = '';
      pointSpan.style.border = 'none';
    }
    // 交換ボタン
    const btn = document.createElement('button');
    btn.textContent = '交換';
    btn.className = 'exchange';
    btn.style.marginLeft = '16px';
    btn.addEventListener('click', () => {
      if (luxuryPoint >= item.cost) {
        const oldEffect = $('luxury-exchange-effect');
        if (oldEffect) oldEffect.remove();
        const effect = document.createElement('div');
        effect.id = 'luxury-exchange-effect';
        effect.textContent = `「${item.name}」ゲット！`;
        Object.assign(effect.style, {
          position: 'fixed', top: '50%', left: '50%',
          transform: 'translate(-50%, -50%) scale(0.7) rotate(-8deg)',
          background: 'linear-gradient(90deg, #fffbe7 60%, #ffd54f 100%)',
          color: '#ff9800', fontSize: '2.2em', fontWeight: 'bold',
          padding: '32px 48px', borderRadius: '32px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)', zIndex: '9999',
          textAlign: 'center', opacity: '0', pointerEvents: 'none',
          letterSpacing: '0.1em', border: '4px solid #ff9800', transition: 'none'
        });
        document.body.appendChild(effect);
        setTimeout(() => {
          effect.animate([
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.7) rotate(-8deg)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1.1) rotate(2deg)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
            { opacity: 1, transform: 'translate(-50%, -50%) scale(1) rotate(0deg)' },
            { opacity: 0, transform: 'translate(-50%, -50%) scale(0.7) rotate(8deg)' }
          ], { duration: 1200, easing: 'cubic-bezier(.7,0,.3,1)' });
          setTimeout(() => { effect.remove(); }, 1200);
        }, 10);
        setTimeout(() => {
          luxuryPoint -= item.cost;
          pointHistory.push({
            type: "消費",
            detail: `贅沢アイテム「${item.name}」交換`,
            amount: -item.cost,
            date: new Date().toISOString(),
          });
          saveAll();
          updatePoints();
          updateLuxuryItems();
          updatePointHistory();
          setTimeout(() => { alert(`「${item.name}」を交換しました！`); }, 100);
        }, 1200);
      } else {
        alert("贅沢ポイントが足りません");
      }
    });
    // 三点リーダー
    const menuButton = document.createElement('button');
    menuButton.textContent = '︙';
    menuButton.className = 'menu-btn';
    menuButton.style.marginLeft = '12px';
    // メニュー
    const menu = createMenu({
      menuClass: 'luxury-menu',
      onEdit: e => {
        e.stopPropagation();
        menu.style.display = 'none';
        luxuryItemNameInput.value = item.name;
        luxuryItemCostInput.value = item.cost;
        const index = luxuryItems.findIndex(l => l === item);
        if (index !== -1) luxuryItems.splice(index, 1);
        saveAll();
        updateLuxuryItems();
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="tab-luxury"]').classList.add('active');
        $('tab-luxury').classList.add('active');
      },
      onDelete: e => {
        e.stopPropagation();
        menu.style.display = 'none';
        if(confirm(`「${item.name}」を削除しますか？`)){
          const index = luxuryItems.findIndex(l => l === item);
          if (index !== -1) luxuryItems.splice(index, 1);
          saveAll();
          updateLuxuryItems();
        }
      }
    });
    menuButton.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.context-menu').forEach(m => { if(m!==menu) m.style.display='none'; });
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => { menu.style.display = 'none'; });
    // 右側
    const rightWrapper = document.createElement('span');
    rightWrapper.style.display = 'flex';
    rightWrapper.style.alignItems = 'center';
    rightWrapper.style.marginLeft = 'auto';
    rightWrapper.style.position = 'relative';
    rightWrapper.append(pointSpan, btn, menuButton, menu);
    li.append(leftSpan, rightWrapper);
    luxuryItemsList.appendChild(li);
  });
}

// --- 贅沢アイテム追加 ---
luxuryForm.addEventListener('submit', e => {
  e.preventDefault();
  const name = luxuryItemNameInput.value.trim();
  const cost = parseInt(luxuryItemCostInput.value);
  if (!name || !cost || cost < 1) {
    alert('アイテム名と贅沢ポイントを正しく入力してください');
    return;
  }
  luxuryItems.push({ name, cost });
  luxuryItemNameInput.value = '';
  luxuryItemCostInput.value = '';
  saveAll();
  updateLuxuryItems();
});

// --- タスク一覧 ---
function renderTaskList() {
  const ongoing = $('task-list-ongoing');
  const past = $('task-list-past');
  let upcoming = $('task-list-upcoming');
  if (!upcoming) {
    upcoming = document.createElement('ul');
    upcoming.id = 'task-list-upcoming';
    const section = document.getElementById('tab-task-list');
    if (section && !document.getElementById('upcoming-title')) {
      const title = document.createElement('h3');
      title.textContent = 'これからのタスク';
      title.id = 'upcoming-title';
      section.insertBefore(title, section.firstChild);
      section.insertBefore(upcoming, title.nextSibling);
    }
  }
  ongoing.innerHTML = '';
  past.innerHTML = '';
  upcoming.innerHTML = '';
  const todayStr = (new Date()).toISOString().slice(0, 10);

  tasks.forEach((task, idx) => {
    const li = document.createElement('li');
    li.style.position = 'relative';

    // タスク名
    const left = document.createElement('span');
    left.className = 'task-list-title';
    left.textContent = task.name;

    // ボーナス進捗バー（これからのタスクには表示しない）
    let barWrapper = null;
    let streakCount = 0;
    let bonusTarget = 0;
    let barColor = '#81c784';
    if (!task.doneHistory) task.doneHistory = [];
    if (task.repeatType === 'weekday') {
      streakCount = 1;
      for (let i = task.doneHistory.length - 2; i >= 0; i--) {
        let prev = new Date(task.doneHistory[i + 1].date);
        prev.setDate(prev.getDate() - 1);
        if (task.doneHistory[i].done && task.doneHistory[i].date === prev.toISOString().slice(0, 10)) {
          streakCount++;
        } else {
          break;
        }
      }
      bonusTarget = 5;
      barColor = '#42a5f5';
    } else if (task.repeatType === 'everyday') {
      streakCount = 1;
      for (let i = task.doneHistory.length - 2; i >= 0; i--) {
        let prev = new Date(task.doneHistory[i + 1].date);
        prev.setDate(prev.getDate() - 1);
        if (task.doneHistory[i].done && task.doneHistory[i].date === prev.toISOString().slice(0, 10)) {
          streakCount++;
        } else {
          break;
        }
      }
      bonusTarget = 7;
      barColor = '#ffb300';
    }

    // 開始日時・繰り返し頻度・終了日時・獲得ポイント（4行縦並び）
    const info = document.createElement('div');
    info.className = 'task-list-info';
    info.style.display = 'flex';
    info.style.flexDirection = 'column';
    info.style.alignItems = 'center';
    info.style.justifyContent = 'center';

    // 各行
    const startSpan = document.createElement('span');
    startSpan.textContent = `開始日時: ${task.date || '-'}`;
    startSpan.style.textAlign = 'center';

    const repeatSpan = document.createElement('span');
    repeatSpan.textContent = `繰り返し頻度: ${getRepeatLabel(task)}`;
    repeatSpan.style.textAlign = 'center';

    const endSpan = document.createElement('span');
    endSpan.textContent = `終了日時: ${task.endDate || '-'}`;
    endSpan.style.textAlign = 'center';

    const pointSpan = document.createElement('span');
    pointSpan.textContent = `獲得ポイント: ${task.point}pt`;
    pointSpan.className = 'task-point';
    pointSpan.style.textAlign = 'center';

    // ボーナスバーは「これからのタスク」以外のみ
    if (bonusTarget > 0 && task.date <= todayStr) {
      barWrapper = document.createElement('div');
      barWrapper.style.width = '100%';
      barWrapper.style.margin = '6px 0 0 0';
      barWrapper.style.display = 'flex';
      barWrapper.style.alignItems = 'center';
      barWrapper.style.gap = '8px';
      barWrapper.style.justifyContent = 'center';

      const bar = document.createElement('div');
      bar.style.flex = '1';
      bar.style.height = '12px';
      bar.style.background = '#eee';
      bar.style.borderRadius = '6px';
      bar.style.overflow = 'hidden';
      bar.style.position = 'relative';
      bar.style.maxWidth = '120px';

      const fill = document.createElement('div');
      fill.style.height = '100%';
      fill.style.width = `${Math.min(streakCount, bonusTarget) / bonusTarget * 100}%`;
      fill.style.background = barColor;
      fill.style.borderRadius = '6px';
      fill.style.transition = 'width 0.3s';

      bar.appendChild(fill);

      const barText = document.createElement('span');
      barText.style.fontSize = '0.9em';
      barText.style.marginLeft = '8px';
      barText.style.color = '#666';
      if (streakCount >= bonusTarget) {
        barText.textContent = 'ボーナス達成！';
        barText.style.color = '#d32f2f';
      } else {
        barText.textContent = `あと${bonusTarget - streakCount}日`;
      }

      barWrapper.append(bar, barText);
    }

    info.append(startSpan, repeatSpan, endSpan, pointSpan);
    if (barWrapper) info.append(barWrapper);

    // 三点リーダーメニュー
    const menuButton = document.createElement('button');
    menuButton.textContent = '︙';
    menuButton.className = 'menu-btn';
    menuButton.type = 'button';

    // メニュー
    const menu = createMenu({
      menuClass: 'task-menu',
      onEdit: e => {
        e.stopPropagation();
        menu.style.display = 'none';
        taskInput.value = task.name;
        pointInput.value = task.point;
        dateInput.value = task.date;
        document.getElementById('end-date-input').value = task.endDate || '';
        repeatType.value = task.repeatType || 'none';
        repeatInterval.value = task.repeatInterval || '';
        repeatInterval.style.display = (task.repeatType === 'interval') ? 'block' : 'none';
        tasks.splice(idx, 1);
        saveAll();
        updateTodayTasks();
        renderCalendar();
        renderTaskList();
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(c => c.classList.remove('active'));
        document.querySelector('[data-tab="tab-task-add"]').classList.add('active');
        $('tab-task-add').classList.add('active');
      },
      onDelete: e => {
        e.stopPropagation();
        menu.style.display = 'none';
        if(confirm(`タスク「${task.name}」を削除しますか？`)){
          tasks.splice(idx, 1);
          saveAll();
          updateTodayTasks();
          renderCalendar();
          renderTaskList();
        }
      }
    });
    menuButton.addEventListener('click', e => {
      e.stopPropagation();
      document.querySelectorAll('.context-menu').forEach(m => { if(m!==menu) m.style.display='none'; });
      menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
    });
    // スクロールやスマホでも閉じる
    document.addEventListener('click', () => { menu.style.display = 'none'; });

    // 右側（ポイントと三点リーダー）を右端に固定
    const right = document.createElement('span');
    right.className = 'task-list-right';
    right.append(menuButton, menu);

    // 並び順: タスク名 | 4行情報+バー | 三点リーダー
    li.append(left, info, right);

    // これからのタスク（明日以降開始）
    if (task.date > todayStr) {
      upcoming.appendChild(li);
      return;
    }
    // 継続中か過去か判定
    let isPast = false;
    if (!task.repeat && task.date < todayStr) isPast = true;
    if (task.repeat && task.lastDoneDate && task.lastDoneDate < todayStr) isPast = true;

    if (!isPast) {
      ongoing.appendChild(li);
    } else {
      past.appendChild(li);
    }
  });
}
function getRepeatLabel(task) {
  // 選択肢に応じた日本語表示
  if (task.repeatType === 'everyday') return '毎日';
  if (task.repeatType === 'weekday') return '平日';
  if (task.repeatType === 'holiday') return '土日祝';
  if (task.repeatType === 'interval') return `間隔: ${task.repeatInterval}日`;
  if (task.repeatType === 'none' || !task.repeat) return 'なし';
  return task.repeatType;
}

// --- ポイント履歴 ---
function updatePointHistory() {
  pointHistoryList.innerHTML = '';
  [...pointHistory].reverse().forEach(entry => {
    if (entry.type === "交換" || entry.type === "獲得" || entry.type === "取消" || entry.type === "消費") {
      const li = document.createElement('li');
      li.textContent = `[${entry.date.slice(0,10)}] ${entry.type}：${entry.detail} (${entry.amount > 0 ? '+' : ''}${entry.amount}pt)`;
      pointHistoryList.appendChild(li);
    }
  });
  const itemHistoryList = $('item-history-list');
  itemHistoryList.innerHTML = '';
  [...pointHistory].reverse().forEach(entry => {
    if (entry.type === "消費" && entry.detail.includes("贅沢アイテム")) {
      const li = document.createElement('li');
      li.textContent = `[${entry.date.slice(0,10)}] ${entry.detail} (${entry.amount}pt)`;
      itemHistoryList.appendChild(li);
    }
  });
}

// --- タスク完了フラグリセット ---
function resetDailyDoneFlags() {
  const todayStr = (new Date()).toISOString().slice(0,10);
  tasks.forEach(task => {
    if (task.repeat) {
      if (task.lastDoneDate !== todayStr) task.doneToday = false;
    } else {
      if (task.doneToday && task.lastDoneDate !== todayStr) task.doneToday = false;
    }
  });
  saveAll();
}

// --- ポイント→贅沢ポイント交換 ---
exchangeButton.addEventListener('click', () => {
  const exchangeAmount = 10;
  if (pointTotal >= exchangeAmount) {
    exchangeButtonAnimation();
    pointTotal -= exchangeAmount;
    luxuryPoint += 1;
    pointHistory.push({
      type: "交換",
      detail: `ポイント${exchangeAmount}pt→贅沢ポイント1ptに交換`,
      amount: -exchangeAmount,
      date: new Date().toISOString(),
    });
    pointHistory.push({
      type: "獲得",
      detail: `贅沢ポイント1pt獲得（ポイント交換）`,
      amount: 1,
      date: new Date().toISOString(),
    });
    saveAll();
    updatePoints();
    updatePointHistory();
  } else {
    alert("ポイントが足りません（10pt以上必要）");
  }
});

// --- 交換ボタンアニメーション ---
function exchangeButtonAnimation() {
  exchangeButton.animate([
    { transform: 'scale(1)', backgroundColor: '#fff' },
    { transform: 'scale(1.15)', backgroundColor: '#ffe082' },
    { transform: 'scale(1)', backgroundColor: '#fff' }
  ], { duration: 400, easing: 'ease' });
}

// --- 初期化 ---
function init() {
  resetDailyDoneFlags();
  updatePoints();
  updateTodayTasks();
  renderCalendar();
  updateLuxuryItems();
  updatePointHistory();
  renderTaskList();
}
init();

function isTaskForToday(task, todayStr) {
  if (!task.repeat) return task.date === todayStr;
  if (task.repeatType === 'everyday') return true;
  if (task.repeatType === 'weekday') {
    const day = new Date(todayStr).getDay();
    return day >= 1 && day <= 5;
  }
  if (task.repeatType === 'holiday') {
    const day = new Date(todayStr).getDay();
    return day === 0 || day === 6;
  }
  if (task.repeatType === 'interval') {
    const start = new Date(task.date);
    const today = new Date(todayStr);
    const diff = Math.floor((today - start) / (1000 * 60 * 60 * 24));
    return diff % task.repeatInterval === 0 && diff >= 0;
  }
  return task.date === todayStr;
}
