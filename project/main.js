import './style.css'

const STORAGE_KEYS = {
  CATS: 'pawfect_cats',
  CURRENT_CAT: 'pawfect_current_cat',
  THEME: 'pawfect_theme',
  HISTORY: 'pawfect_history',
  LAST_RESET: 'pawfect_last_reset'
};

const THEMES = {
  purple: { primary: '#a78bfa', secondary: '#e0c3fc', accent: '#fef3c7', extra: '#bfdbfe' },
  blue: { primary: '#60a5fa', secondary: '#bfdbfe', accent: '#ddd6fe', extra: '#fef3c7' },
  green: { primary: '#4ade80', secondary: '#bbf7d0', accent: '#fde68a', extra: '#fecaca' },
  peach: { primary: '#fdba74', secondary: '#fde68a', accent: '#fca5a5', extra: '#c4b5fd' },
  pink: { primary: '#f9a8d4', secondary: '#fbcfe8', accent: '#ddd6fe', extra: '#fed7aa' }
};

let cats = [];
let currentCatIndex = 0;

function init() {
  setTimeout(() => {
    document.getElementById('loading-screen').style.display = 'none';
    document.getElementById('app').style.display = 'block';
  }, 3000);

  loadTheme();
  loadCats();
  updateDate();
  checkMidnightReset();
  setupEventListeners();

  if (cats.length === 0) {
    showPetSetupModal();
  } else {
    loadCurrentCat();
    renderChecklist();
    updateCatSwitcher();
  }
}

function loadTheme() {
  const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME) || 'purple';
  applyTheme(savedTheme);
}

function applyTheme(themeName) {
  const theme = THEMES[themeName];
  if (theme) {
    document.documentElement.style.setProperty('--primary-color', theme.primary);
    document.documentElement.style.setProperty('--secondary-color', theme.secondary);
    document.body.style.background = `linear-gradient(135deg, ${theme.primary}, ${theme.secondary}, ${theme.accent}, ${theme.extra})`;
    document.body.style.backgroundSize = '400% 400%';
    localStorage.setItem(STORAGE_KEYS.THEME, themeName);
  }
}

function loadCats() {
  const saved = localStorage.getItem(STORAGE_KEYS.CATS);
  cats = saved ? JSON.parse(saved) : [];
  const savedIndex = localStorage.getItem(STORAGE_KEYS.CURRENT_CAT);
  currentCatIndex = savedIndex ? parseInt(savedIndex) : 0;
}

function saveCats() {
  localStorage.setItem(STORAGE_KEYS.CATS, JSON.stringify(cats));
}

function loadCurrentCat() {
  if (cats.length > 0 && currentCatIndex < cats.length) {
    return cats[currentCatIndex];
  }
  return null;
}

function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('currentDate').textContent = now.toLocaleDateString('en-US', options);
}

function checkMidnightReset() {
  const lastReset = localStorage.getItem(STORAGE_KEYS.LAST_RESET);
  const today = new Date().toDateString();

  if (lastReset !== today) {
    cats.forEach(cat => {
      cat.tasks.forEach(task => task.completed = false);
    });
    saveCats();
    localStorage.setItem(STORAGE_KEYS.LAST_RESET, today);
  }

  const now = new Date();
  const night = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
  const msToMidnight = night.getTime() - now.getTime();

  setTimeout(() => {
    checkMidnightReset();
    renderChecklist();
  }, msToMidnight);
}

function setupEventListeners() {
  document.getElementById('menuToggle').addEventListener('click', () => {
    document.getElementById('sideMenu').classList.add('active');
    document.getElementById('overlay').classList.add('active');
  });

  document.getElementById('closeMenu').addEventListener('click', closeMenu);
  document.getElementById('overlay').addEventListener('click', closeMenu);

  document.querySelectorAll('.menu-item').forEach(item => {
    item.addEventListener('click', (e) => {
      const tab = e.target.dataset.tab;
      navigateToPage(tab);
      closeMenu();
    });
  });

  document.getElementById('themeBtn').addEventListener('click', () => {
    const palette = document.getElementById('themePalette');
    palette.style.display = palette.style.display === 'none' ? 'block' : 'none';
  });

  document.querySelectorAll('.color-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const theme = e.target.dataset.theme;
      applyTheme(theme);
      document.getElementById('themePalette').style.display = 'none';
    });
  });

  document.getElementById('resetBtn').addEventListener('click', resetDay);

  document.getElementById('chatBot').addEventListener('click', () => {
    document.getElementById('chatWindow').style.display = 'block';
  });

  document.getElementById('closeChat').addEventListener('click', () => {
    document.getElementById('chatWindow').style.display = 'none';
  });

  document.querySelectorAll('.chat-option').forEach(option => {
    option.addEventListener('click', (e) => {
      const question = e.target.dataset.q;
      handleChatQuestion(question, e.target.textContent);
    });
  });

  document.getElementById('petSetupForm').addEventListener('submit', handlePetSetup);

  document.getElementById('addCatBtn').addEventListener('click', showPetSetupModal);

  document.getElementById('prevCat').addEventListener('click', () => {
    if (cats.length > 1) {
      currentCatIndex = (currentCatIndex - 1 + cats.length) % cats.length;
      localStorage.setItem(STORAGE_KEYS.CURRENT_CAT, currentCatIndex);
      renderChecklist();
      updateCatSwitcher();
    }
  });

  document.getElementById('nextCat').addEventListener('click', () => {
    if (cats.length > 1) {
      currentCatIndex = (currentCatIndex + 1) % cats.length;
      localStorage.setItem(STORAGE_KEYS.CURRENT_CAT, currentCatIndex);
      renderChecklist();
      updateCatSwitcher();
    }
  });
}

function closeMenu() {
  document.getElementById('sideMenu').classList.remove('active');
  document.getElementById('overlay').classList.remove('active');
}

function navigateToPage(page) {
  document.querySelectorAll('.page').forEach(p => p.style.display = 'none');

  if (page === 'home') {
    document.getElementById('homePage').style.display = 'block';
  } else if (page === 'my-cats') {
    document.getElementById('myCatsPage').style.display = 'block';
    renderCatsList();
  } else if (page === 'history') {
    document.getElementById('historyPage').style.display = 'block';
    renderHistory();
  }
}

function renderChecklist() {
  const cat = loadCurrentCat();
  if (!cat) return;

  const checklist = document.getElementById('checklist');
  checklist.innerHTML = '';

  cat.tasks.forEach((task, index) => {
    const taskDiv = document.createElement('div');
    taskDiv.className = `task-item ${task.completed ? 'completed' : ''}`;

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.id = `task-${index}`;
    checkbox.checked = task.completed;
    checkbox.addEventListener('change', (e) => toggleTask(index, e.target.checked));

    const label = document.createElement('label');
    label.htmlFor = `task-${index}`;
    label.textContent = task.name;

    taskDiv.appendChild(checkbox);
    taskDiv.appendChild(label);

    if (task.completed) {
      const paw = document.createElement('span');
      paw.className = 'paw-animation';
      paw.textContent = '🐾';
      taskDiv.appendChild(paw);
    }

    checklist.appendChild(taskDiv);
  });

  checkCompletion();
}

function toggleTask(index, completed) {
  const cat = loadCurrentCat();
  if (!cat) return;

  cat.tasks[index].completed = completed;
  saveCats();
  saveToHistory();
  renderChecklist();
}

function checkCompletion() {
  const cat = loadCurrentCat();
  if (!cat) return;

  const allCompleted = cat.tasks.every(task => task.completed);
  const message = document.getElementById('completionMessage');

  if (allCompleted && cat.tasks.length > 0) {
    message.classList.add('show');
  } else {
    message.classList.remove('show');
  }
}

function resetDay() {
  if (confirm('Are you sure you want to reset all tasks for today?')) {
    const cat = loadCurrentCat();
    if (cat) {
      cat.tasks.forEach(task => task.completed = false);
      saveCats();
      renderChecklist();
    }
  }
}

function updateCatSwitcher() {
  const switcher = document.getElementById('catSwitcher');
  const info = document.getElementById('currentCatInfo');

  if (cats.length > 1) {
    switcher.style.display = 'flex';
    const cat = loadCurrentCat();
    info.textContent = cat ? `${cat.name} 🐱` : '';
  } else {
    switcher.style.display = 'none';
  }
}

function showPetSetupModal() {
  document.getElementById('petSetupModal').style.display = 'flex';
}

function handlePetSetup(e) {
  e.preventDefault();

  const name = document.getElementById('petName').value;
  const birthday = document.getElementById('petBirthday').value;
  const age = parseFloat(document.getElementById('petAge').value);

  const taskCheckboxes = document.querySelectorAll('.task-options input[type="checkbox"]:checked');
  const tasks = Array.from(taskCheckboxes).map(cb => ({
    name: cb.value,
    completed: false
  }));

  const newCat = { name, birthday, age, tasks };
  cats.push(newCat);
  saveCats();

  if (cats.length === 1) {
    currentCatIndex = 0;
    localStorage.setItem(STORAGE_KEYS.CURRENT_CAT, currentCatIndex);
  }

  document.getElementById('petSetupModal').style.display = 'none';
  document.getElementById('petSetupForm').reset();

  renderChecklist();
  updateCatSwitcher();
}

function renderCatsList() {
  const list = document.getElementById('catsList');
  list.innerHTML = '';

  cats.forEach((cat, index) => {
    const card = document.createElement('div');
    card.className = 'cat-card';

    const age = new Date().getFullYear() - new Date(cat.birthday).getFullYear();

    card.innerHTML = `
      <h3>🐱 ${cat.name}</h3>
      <p><strong>Birthday:</strong> ${cat.birthday}</p>
      <p><strong>Age:</strong> ${cat.age} years</p>
      <p><strong>Tasks:</strong> ${cat.tasks.map(t => t.name).join(', ')}</p>
    `;

    list.appendChild(card);
  });
}

function saveToHistory() {
  const cat = loadCurrentCat();
  if (!cat) return;

  const today = new Date().toDateString();
  const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');

  const existingEntry = history.find(entry => entry.date === today && entry.catName === cat.name);

  const completed = cat.tasks.filter(t => t.completed).length;
  const total = cat.tasks.length;

  if (existingEntry) {
    existingEntry.completed = completed;
    existingEntry.total = total;
  } else {
    history.push({
      date: today,
      catName: cat.name,
      completed,
      total
    });
  }

  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const filtered = history.filter(entry => new Date(entry.date) >= oneMonthAgo);
  localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(filtered));
}

function renderHistory() {
  const list = document.getElementById('historyList');
  const history = JSON.parse(localStorage.getItem(STORAGE_KEYS.HISTORY) || '[]');

  list.innerHTML = '';

  if (history.length === 0) {
    list.innerHTML = '<p style="text-align: center; color: var(--text-color);">No history yet. Start checking off tasks!</p>';
    return;
  }

  history.reverse().forEach(entry => {
    const item = document.createElement('div');
    item.className = 'history-item';

    const percentage = (entry.completed / entry.total * 100).toFixed(0);

    item.innerHTML = `
      <h3>${entry.date}</h3>
      <p><strong>Cat:</strong> ${entry.catName}</p>
      <p><strong>Tasks Completed:</strong> ${entry.completed} / ${entry.total} (${percentage}%)</p>
    `;

    list.appendChild(item);
  });
}

function handleChatQuestion(question, questionText) {
  const messagesDiv = document.getElementById('chatMessages');

  const userMsg = document.createElement('div');
  userMsg.className = 'user-message';
  userMsg.textContent = questionText;
  messagesDiv.appendChild(userMsg);

  const typingDiv = document.createElement('div');
  typingDiv.className = 'bot-message typing-indicator';
  typingDiv.textContent = 'Typing';
  messagesDiv.appendChild(typingDiv);

  setTimeout(() => {
    typingDiv.remove();

    const botMsg = document.createElement('div');
    botMsg.className = 'bot-message';

    let answer = '';

    if (question === 'developer') {
      answer = `This site was lovingly developed by Afifa Husna, a Full Stack Developer 💻.<br><br>
      My Portfolio: <a href="https://afifa-creative-portfolio.netlify.app/" target="_blank">https://afifa-creative-portfolio.netlify.app/</a><br><br>
      My LinkedIn: <a href="https://www.linkedin.com/in/afifa-husna-6b5472345/" target="_blank">https://www.linkedin.com/in/afifa-husna-6b5472345/</a><br><br>
      I created this site for my friend, who is like my sister. She has two cats, Bella & Luna 🐱🐱. Once I promised her I'd make something special, and here we go! In the future, I plan to build a mobile app for this, insha'Allah!`;
    } else if (question === 'name') {
      answer = 'Because every pet deserves a perfect, loving day 🐾. We want to help you make every day pawfect for your furry friends!';
    } else if (question === 'islam') {
      answer = `Cats are beloved in Islam. It is Sunnah to care for them 🕌. Our Prophet Muhammad ﷺ showed kindness to cats, and many scholars mention the blessings of having them as pets. They are pure animals and may even drink from our vessels without making them impure. Keeping and caring for a cat brings mercy, love, and reward.`;
    } else if (question === 'addcat') {
      answer = 'Go to the side menu (☰) > My Cats 🐱 > click the "+ Add New Cat" button to add a new furry friend!';
    }

    botMsg.innerHTML = answer;
    messagesDiv.appendChild(botMsg);
    messagesDiv.scrollTop = messagesDiv.scrollHeight;
  }, 1500);
}

init();
