'use strict';

const THEMES = {
  pink:   { light: '#FFD6E7', mid: '#FFB3D1', dark: '#C96B96', bg: '#FFF0F6' },
  yellow: { light: '#FFF9C4', mid: '#FFE066', dark: '#B8860B', bg: '#FFFDE7' },
  blue:   { light: '#C8E6FF', mid: '#7EC8E3', dark: '#2A6FA8', bg: '#EBF6FF' },
  green:  { light: '#C8F5C8', mid: '#7ED9A0', dark: '#2E7D50', bg: '#EBF9EB' },
};

/* model */
const STORAGE_KEY = 'pixel-todo-v1';

function emptyModel() {
  return { todos: [], input: '', filter: 'all', theme: 'pink', nextId: 1 };
}

function loadModel() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? Object.assign(emptyModel(), JSON.parse(raw)) : emptyModel();
  } catch (_) { return emptyModel(); }
}

function saveModel(m) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); } catch (_) {}
}

/* uodate */
const Update = {
  setInput: (m, v) => ({ ...m, input: v }),
  setFilter: (m, f) => ({ ...m, filter: f }),
  setTheme: (m, t) => ({ ...m, theme: t }),
  deleteTodo: (m, id) => ({ ...m, todos: m.todos.filter(t => t.id !== id) }),
  clearCompleted: (m) => ({ ...m, todos: m.todos.filter(t => !t.completed) }),

  addTodo(m) {
    const text = (m.input || '').trim();
    if (!text) return m;
    return { ...m, todos: [...m.todos, { id: m.nextId, text, completed: false }], input: '', nextId: m.nextId + 1 };
  },

  toggleTodo(m, id) {
    return { ...m, todos: m.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t) };
  },
};

/* view */
function escHtml(s) {
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function applyTheme(theme) {
  const t = THEMES[theme] || THEMES.pink;
  const s = document.documentElement.style;
  s.setProperty('--t-light', t.light);
  s.setProperty('--t-mid', t.mid);
  s.setProperty('--t-dark', t.dark);
  s.setProperty('--t-bg', t.bg);
  document.body.style.backgroundColor = t.bg;
  document.querySelectorAll('.circle').forEach(b =>
    b.classList.toggle('active', b.dataset.theme === theme)
  );
}

function renderList(m) {
  const el = document.getElementById('todo-list');
  const visible = m.filter === 'active'    ? m.todos.filter(t => !t.completed)
                : m.filter === 'completed' ? m.todos.filter(t =>  t.completed)
                : m.todos;

  if (!visible.length) {
    const msg = { all: 'nothing yet — add a task!', active: 'no active tasks', completed: 'nothing done yet!' };
    el.innerHTML = `<li class="empty-msg">${msg[m.filter]}</li>`;
    return;
  }

  el.innerHTML = visible.map(t => `
    <li class="todo-item${t.completed ? ' completed' : ''}" data-id="${t.id}">
      <div class="pixel-cb${t.completed ? ' checked' : ''}" data-action="toggle"
           role="checkbox" aria-checked="${t.completed}" tabindex="0">
        ${t.completed ? '&#10003;' : ''}
      </div>
      <span class="item-label">${escHtml(t.text)}</span>
      <button class="del-btn" data-action="delete" aria-label="Delete">x</button>
    </li>`).join('');
}

function view(m) {
  applyTheme(m.theme);

  const inp = document.getElementById('new-todo');
  inp.value = m.input;

  renderList(m);

  const left = m.todos.filter(t => !t.completed).length;
  document.getElementById('count-msg').textContent = `${left} item${left !== 1 ? 's' : ''} left`;

  document.querySelectorAll('.filter-btn').forEach(b =>
    b.classList.toggle('active', b.dataset.filter === m.filter)
  );
}

/* dispatch */
let model = loadModel();

function dispatch(action, payload) {
  if (!Update[action]) return;
  model = Update[action](model, payload);
  saveModel(model);
  view(model);
}

/* event */
const inp = document.getElementById('new-todo');
inp.addEventListener('input',   e => dispatch('setInput', e.target.value));
inp.addEventListener('keydown', e => { if (e.key === 'Enter') dispatch('addTodo'); });

document.getElementById('add-btn').addEventListener('click', () => dispatch('addTodo'));
document.getElementById('clear-btn').addEventListener('click', () => dispatch('clearCompleted'));

document.querySelectorAll('.filter-btn').forEach(b =>
  b.addEventListener('click', () => dispatch('setFilter', b.dataset.filter))
);
document.querySelectorAll('.circle').forEach(b =>
  b.addEventListener('click', () => dispatch('setTheme', b.dataset.theme))
);

document.getElementById('todo-list').addEventListener('click', e => {
  const item = e.target.closest('.todo-item');
  if (!item) return;
  const id = Number(item.dataset.id);
  const action = e.target.closest('[data-action]')?.dataset.action;
  if (action === 'toggle') dispatch('toggleTodo', id);
  if (action === 'delete') dispatch('deleteTodo', id);
});

document.getElementById('todo-list').addEventListener('keydown', e => {
  if ((e.key === ' ' || e.key === 'Enter') && e.target.matches('.pixel-cb')) {
    e.preventDefault();
    dispatch('toggleTodo', Number(e.target.closest('.todo-item').dataset.id));
  }
});

/* boot */
view(model);