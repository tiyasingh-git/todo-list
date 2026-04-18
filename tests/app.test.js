'use strict';

function emptyModel() {
  return { todos: [], input: '', filter: 'all', theme: 'pink', nextId: 1 };
}

const Update = {
  setInput:       (m, v)  => ({ ...m, input: v }),
  setFilter:      (m, f)  => ({ ...m, filter: f }),
  setTheme:       (m, t)  => ({ ...m, theme: t }),
  deleteTodo:     (m, id) => ({ ...m, todos: m.todos.filter(t => t.id !== id) }),
  clearCompleted: (m)     => ({ ...m, todos: m.todos.filter(t => !t.completed) }),
  addTodo(m) {
    const text = (m.input || '').trim();
    if (!text) return m;
    return { ...m, todos: [...m.todos, { id: m.nextId, text, completed: false }], input: '', nextId: m.nextId + 1 };
  },
  toggleTodo(m, id) {
    return { ...m, todos: m.todos.map(t => t.id === id ? { ...t, completed: !t.completed } : t) };
  },
};

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}\n    ${e.message}`); failed++; }
}
function eq(a, b, msg) { if (a !== b) throw new Error(msg || `Expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

console.log('\nPixel Todo — unit tests\n');

test('emptyModel defaults', () => { const m = emptyModel(); eq(m.todos.length,0); eq(m.filter,'all'); eq(m.theme,'pink'); });
test('setInput', () => eq(Update.setInput(emptyModel(),'hi').input, 'hi'));
test('addTodo creates item', () => { let m = Update.addTodo(Update.setInput(emptyModel(),'task')); eq(m.todos.length,1); eq(m.input,''); });
test('addTodo ignores whitespace', () => eq(Update.addTodo(Update.setInput(emptyModel(),'  ')).todos.length, 0));
test('toggleTodo flips done', () => { let m = Update.toggleTodo(Update.addTodo(Update.setInput(emptyModel(),'t')), 1); eq(m.todos[0].completed, true); });
test('deleteTodo removes item', () => { let m = Update.deleteTodo(Update.addTodo(Update.setInput(emptyModel(),'t')), 1); eq(m.todos.length, 0); });
test('clearCompleted', () => {
  let m = emptyModel();
  m = Update.addTodo(Update.setInput(m,'a'));
  m = Update.addTodo(Update.setInput(m,'b'));
  m = Update.toggleTodo(m, 2);
  m = Update.clearCompleted(m);
  eq(m.todos.length, 1); eq(m.todos[0].text, 'a');
});
test('setFilter', () => eq(Update.setFilter(emptyModel(),'active').filter, 'active'));
test('setTheme', () => eq(Update.setTheme(emptyModel(),'blue').theme, 'blue'));
test('no mutation', () => { const o = emptyModel(); Update.addTodo(Update.setInput(o,'x')); eq(o.todos.length,0); });

console.log(`\n${passed} passed, ${failed} failed\n`);
process.exit(failed > 0 ? 1 : 0);