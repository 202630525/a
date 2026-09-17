// Constants & Initial Configurations
const SUBJECTS = ['선택안함', '국어A', '국어B', '수학', '영어', '과학A', '과학B', '사회', '역사', '창체', '체육', '미술', '기술가정'];
const DAYS_EN = ['mon', 'tue', 'wed', 'thu', 'fri'];
const DAYS_KO = ['월', '화', '수', '목', '금'];
const PERIODS = 7;

// Application State
let todos = JSON.parse(localStorage.getItem('gap_todos')) || [];
let currentSelectedDate = new Date();

// Pomodoro Timer State
let timerSeconds = 25 * 60;
let timerInterval = null;
let isTimerRunning = false;

// Initialize App on DOM Content Loaded
document.addEventListener('DOMContentLoaded', () => {
  initSubjectSelect();
  initTheme();
  initSavedApiKey();
  setToday();
  renderTodos();
  setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
  document.getElementById('todo-form').addEventListener('submit', handleAddTodo);
  document.getElementById('chat-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendChatMessage();
  });
}

// -----------------------------------------------------------------
// 1. Theme Management (Light / Dark Mode)
// -----------------------------------------------------------------
function toggleDarkMode() {
  document.body.classList.toggle('dark-mode');
  const isDark = document.body.classList.contains('dark-mode');
  localStorage.setItem('gap_theme', isDark ? 'dark' : 'light');
}

function initTheme() {
  if (localStorage.getItem('gap_theme') === 'dark') {
    document.body.classList.add('dark-mode');
  }
}

// -----------------------------------------------------------------
// 2. Calendar & Timetable Hybrid Sync Logic
// -----------------------------------------------------------------
function setToday() {
  currentSelectedDate = new Date();
  document.getElementById('calendar-picker').valueAsDate = currentSelectedDate;
  renderCalendarView();
}

function changeWeek(offsetDays) {
  currentSelectedDate.setDate(currentSelectedDate.getDate() + offsetDays);
  document.getElementById('calendar-picker').valueAsDate = currentSelectedDate;
  renderCalendarView();
}

function onDatePickerChange() {
  const pickerVal = document.getElementById('calendar-picker').value;
  if (pickerVal) {
    currentSelectedDate = new Date(pickerVal + 'T00:00:00');
    renderCalendarView();
  }
}

function renderCalendarView() {
  const dayOfWeek = currentSelectedDate.getDay(); // 0:Sun, 1:Mon, ...
  const monday = new Date(currentSelectedDate);
  monday.setDate(currentSelectedDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const friday = new Date(monday);
  friday.setDate(monday.getDate() + 4);

  // Update Week Label Range
  const weekLabel = `${monday.getMonth() + 1}.${monday.getDate()} (${DAYS_KO[0]}) ~ ${friday.getMonth() + 1}.${friday.getDate()} (${DAYS_KO[4]})`;
  document.getElementById('current-week-label').innerText = weekLabel;

  // Build Dynamic Header Row with Dates
  const headerRow = document.getElementById('timetable-header');
  headerRow.innerHTML = '<th>교시</th>';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 0; i < 5; i++) {
    const targetDay = new Date(monday);
    targetDay.setDate(monday.getDate() + i);
    const isToday = targetDay.getTime() === today.getTime();
    headerRow.innerHTML += `<th class="${isToday ? 'today-highlight' : ''}">${DAYS_KO[i]} (${targetDay.getDate()}일)</th>`;
  }

  renderTimetable(monday);
}

function renderTimetable(mondayDate) {
  const tbody = document.getElementById('timetable-body');
  tbody.innerHTML = '';
  const savedConfig = JSON.parse(localStorage.getItem('gap_timetable')) || {};

  for (let p = 1; p <= PERIODS; p++) {
    const tr = document.createElement('tr');
    let rowHtml = `<td><b>${p}</b></td>`;

    for (let d = 0; d < 5; d++) {
      const cellDate = new Date(mondayDate);
      cellDate.setDate(mondayDate.getDate() + d);
      const dateStr = cellDate.toISOString().split('T')[0];

      const cellId = `${DAYS_EN[d]}-${p}`;
      const defaultSubject = savedConfig[cellId] || '선택안함';

      const options = SUBJECTS.map(s => 
        `<option value="${s}" ${s === defaultSubject ? 'selected' : ''}>${s}</option>`
      ).join('');

      // Find assessments due on this specific date
      const matchingTasks = todos.filter(t => t.date === dateStr && (t.subject === defaultSubject || defaultSubject === '선택안함'));
      const tags = matchingTasks.map(t => `<span class="assessment-tag" title="${t.title}">🔥 [${t.weight}%] ${t.title}</span>`).join('');

      rowHtml += `<td>
        <select id="${cellId}" onchange="saveTimetableConfig(true)">${options}</select>
        ${tags}
      </td>`;
    }
    tr.innerHTML = rowHtml;
    tbody.appendChild(tr);
  }
}

function saveTimetableConfig(silent = false) {
  const config = {};
  for (let p = 1; p <= PERIODS; p++) {
    DAYS_EN.forEach(d => {
      const id = `${d}-${p}`;
      const elem = document.getElementById(id);
      if (elem) config[id] = elem.value;
    });
  }
  localStorage.setItem('gap_timetable', JSON.stringify(config));
  if (!silent) alert('기본 시간표가 저장되었습니다!');
  renderCalendarView();
}

// -----------------------------------------------------------------
// 3. Priority Calculation & Evaluation Tasks
// -----------------------------------------------------------------
function initSubjectSelect() {
  const select = document.getElementById('subject-select');
  select.innerHTML = SUBJECTS.filter(s => s !== '선택안함')
    .map(s => `<option value="${s}">${s}</option>`).join('');
}

function renderTodos() {
  const list = document.getElementById('todo-list');
  const timerSelect = document.getElementById('timer-task-select');

  list.innerHTML = '';
  timerSelect.innerHTML = '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Priority Score Formula = Weight (%) / (Days Remaining + 1)
  todos.forEach(t => {
    const due = new Date(t.date + 'T00:00:00');
    const diffDays = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
    t.daysLeft = diffDays;
    t.priorityScore = diffDays < 0 ? 0 : parseFloat((t.weight / (diffDays + 1)).toFixed(1));
  });

  // Sort by highest priority score
  todos.sort((a, b) => b.priorityScore - a.priorityScore);

  todos.forEach((t, idx) => {
    const li = document.createElement('li');
    li.className = `todo-item ${t.priorityScore > 8 ? 'priority-high' : ''}`;
    li.innerHTML = `
      <div>
        <div>
          <span class="score-badge">우선순위 ${t.priorityScore}</span>
          <b>[${t.subject}] ${t.title}</b>
        </div>
        <div style="font-size:0.75rem; color:var(--text-sub);">
          📅 ${t.date} (${t.daysLeft < 0 ? '마감됨' : `D-${t.daysLeft}`}) | ⚖️ 반영비율: ${t.weight}%
        </div>
      </div>
      <button class="delete-btn" onclick="deleteTodo(${idx})">삭제</button>
    `;
    list.appendChild(li);

    timerSelect.innerHTML += `<option value="${t.title}">[${t.subject}] ${t.title}</option>`;
  });

  renderCalendarView();
}

function handleAddTodo(e) {
  e.preventDefault();
  todos.push({
    subject: document.getElementById('subject-select').value,
    title: document.getElementById('title').value.trim(),
    date: document.getElementById('due-date').value,
    weight: parseInt(document.getElementById('weight').value, 10)
  });
  localStorage.setItem('gap_todos', JSON.stringify(todos));
  document.getElementById('todo-form').reset();
  renderTodos();
}

function deleteTodo(idx) {
  todos.splice(idx, 1);
  localStorage.setItem('gap_todos', JSON.stringify(todos));
  renderTodos();
}

// -----------------------------------------------------------------
// 4. Pomodoro Focus Timer
// -----------------------------------------------------------------
function updateTimerDisplay() {
  const m = Math.floor(timerSeconds / 60).toString().padStart(2, '0');
  const s = (timerSeconds % 60).toString().padStart(2, '0');
  document.getElementById('timer-display').innerText = `${m}:${s}`;
}

function toggleTimer() {
  const btn = document.getElementById('timer-toggle-btn');
  if (isTimerRunning) {
    clearInterval(timerInterval);
    isTimerRunning = false;
    btn.innerText = '시작';
  } else {
    isTimerRunning = true;
    btn.innerText = '일시정지';
    timerInterval = setInterval(() => {
      if (timerSeconds > 0) {
        timerSeconds--;
        updateTimerDisplay();
      } else {
        clearInterval(timerInterval);
        playAlarmSound();
        alert('🎉 25분 몰입 세션 완료! 5분간 휴식하세요.');
        resetTimer();
      }
    }, 1000);
  }
}

function resetTimer() {
  clearInterval(timerInterval);
  isTimerRunning = false;
  timerSeconds = 25 * 60;
  document.getElementById('timer-toggle-btn').innerText = '시작';
  updateTimerDisplay();
}

function playAlarmSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.8);
  } catch (e) {
    console.log('Audio Context not allowed without interaction');
  }
}

// -----------------------------------------------------------------
// 5. Classmate Schedule Sharing (JSON Export / Import)
// -----------------------------------------------------------------
function exportSchedule() {
  const payload = {
    timetable: JSON.parse(localStorage.getItem('gap_timetable')) || {},
    todos: todos
  };
  const code = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
  navigator.clipboard.writeText(code);
  alert('📋 스케줄 공유 코드가 복사되었습니다!\n친구에게 이 코드를 전송하세요.');
}

function importSchedule() {
  const code = prompt('친구에게 받은 스케줄 공유 코드를 붙여넣으세요:');
  if (!code) return;
  try {
    const decoded = JSON.parse(decodeURIComponent(escape(atob(code))));
    if (decoded.timetable && decoded.todos) {
      localStorage.setItem('gap_timetable', JSON.stringify(decoded.timetable));
      todos = decoded.todos;
      localStorage.setItem('gap_todos', JSON.stringify(todos));
      renderTodos();
      alert('🎉 친구의 시간표 및 수행평가 일정이 내 매니저에 적용되었습니다!');
    }
  } catch (e) {
    alert('❌ 코드가 올바르지 않거나 손상되었습니다.');
  }
}

// -----------------------------------------------------------------
// 6. Gemini AI Assistant Integration
// -----------------------------------------------------------------
function initSavedApiKey() {
  const savedKey = localStorage.getItem('gemini_api_key');
  if (savedKey) {
    document.getElementById('gemini-key').value = savedKey;
  }
}

function saveApiKey() {
  const key = document.getElementById('gemini-key').value.trim();
  localStorage.setItem('gemini_api_key', key);
  alert('Gemini API 키가 저장되었습니다.');
}

async function sendChatMessage() {
  const input = document.getElementById('chat-input');
  const msg = input.value.trim();
  const key = localStorage.getItem('gemini_api_key') || document.getElementById('gemini-key').value.trim();

  if (!msg || !key) {
    alert('질문과 Gemini API 키를 모두 입력해주세요.');
    return;
  }

  const box = document.getElementById('chat-box');
  box.innerHTML += `<div class="chat-msg user">나: ${msg}</div>`;
  input.value = '';

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `너는 고등학생 학업 보조 AI '시간의 틈'이야. 친절하고 명쾌하게 가이드를 제공해줘.\n질문: ${msg}` }] }]
      })
    });

    const data = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || '답변을 생성할 수 없습니다.';
    box.innerHTML += `<div class="chat-msg ai">AI: ${reply}</div>`;
  } catch (e) {
    box.innerHTML += `<div class="chat-msg ai" style="color:red;">오류 발생: API 키나 네트워크 연결을 확인하세요.</div>`;
  }
  box.scrollTop = box.scrollHeight;
}
