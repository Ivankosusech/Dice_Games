// ../script/bot_lite_game.js

// Проверка изображений
function checkImages() {
  const images = [1, 2, 3, 4, 5, 6];
  images.forEach(n => {
    const img = new Image();
    img.src = `../img/img_${n}.png`;
    img.onload = () => console.log(`✅ ../img/img_${n}.png загружен`);
    img.onerror = () => console.error(`❌ Не найден файл: ../img/img_${n}.png`);
  });
}
window.onload = checkImages;

// Основные переменные
let currentPlayer = 1;
let diceValue = null;
const diceElement = document.getElementById('dice');
const currentPlayerDisplay = document.getElementById('current-player');
const score1 = document.getElementById('score-1');
const score2 = document.getElementById('score-2');
const resetButton = document.getElementById('reset-btn');

// Функция создания изображения
function createDiceImage(value) {
  const img = document.createElement('img');
  img.src = `../img/img_${value}.png`;
  img.alt = `Кубик ${value}`;
  img.draggable = false;
  return img;
}

// Функция броска кубика
function rollDice() {
  if (currentPlayer !== 1 || diceValue !== null) return;

  diceValue = Math.floor(Math.random() * 6) + 1;
  diceElement.innerHTML = '';
  diceElement.removeAttribute('data-text');

  const img = document.createElement('img');
  img.src = `../img/img_${diceValue}.png`;
  img.alt = `Кубик ${diceValue}`;
  diceElement.appendChild(img);
  diceElement.classList.add('animate');
  setTimeout(() => diceElement.classList.remove('animate'), 300);

  // После броска — игрок может кликнуть на ячейку
}

// Автоматический бросок при ходе игрока
function playerTurn() {
  if (currentPlayer === 1 && diceValue === null) {
    setTimeout(rollDice, 600); // Задержка, чтобы было видно "бросок"
  }
}

// Обработка клика по своей ячейке
document.querySelectorAll('.dice-cell[data-player="1"]').forEach(cell => {
  cell.addEventListener('click', () => {
    if (currentPlayer !== 1 || diceValue === null) return;

    placeDice(1, cell, diceValue);
    diceValue = null;
    diceElement.innerHTML = '?';

    // Передаём ход боту
    setTimeout(botTurn, 1000);
  });
});

// Универсальная функция размещения кубика
function placeDice(player, cell, value) {
  const col = parseInt(cell.dataset.col);
  const columnCells = document.querySelectorAll(`.dice-cell[data-player="${player}"][data-col="${col}"]`);
  const filledCount = Array.from(columnCells).filter(c => c.classList.contains('filled')).length;

  if (filledCount >= 3) {
    if (player === 1) alert('Этот столбец уже заполнен!');
    return;
  }

  let targetCell = null;
  for (let row = 2; row >= 0; row--) {
    const c = document.querySelector(`.dice-cell[data-player="${player}"][data-col="${col}"][data-row="${row}"]`);
    if (!c.classList.contains('filled')) {
      targetCell = c;
      break;
    }
  }

  if (!targetCell) return;

  targetCell.innerHTML = '';
  targetCell.appendChild(createDiceImage(value));
  targetCell.classList.add('filled', 'animate');
  targetCell.style.backgroundColor = '#d9c9b5';

  // Удаление кубиков противника
  const opponent = player === 1 ? 2 : 1;
  document.querySelectorAll(`.dice-cell[data-player="${opponent}"][data-col="${col}"]`).forEach(opCell => {
    const img = opCell.querySelector('img');
    if (img) {
      const match = img.src.match(/img_(\d)\.png$/);
      if (match && parseInt(match[1]) === value) {
        opCell.classList.add('remove-animation');
        setTimeout(() => {
          opCell.innerHTML = '';
          opCell.classList.remove('filled', 'remove-animation');
          opCell.style.backgroundColor = '';
        }, 400);
      }
    }
  });
}

// Ход бота
function botTurn() {
  currentPlayer = 2;
  currentPlayerDisplay.textContent = 'Ход: Бот';

  const botDice = Math.floor(Math.random() * 6) + 1;
  diceElement.innerHTML = '';
  diceElement.appendChild(createDiceImage(botDice));
  diceElement.classList.add('animate');
  setTimeout(() => diceElement.classList.remove('animate'), 300);

  setTimeout(() => {
    const cols = [0,1,2].sort(() => 0.5 - Math.random());
    let placed = false;

    for (let col of cols) {
      const columnCells = document.querySelectorAll(`.dice-cell[data-player="2"][data-col="${col}"]`);
      const filledCount = Array.from(columnCells).filter(c => c.classList.contains('filled')).length;
      if (filledCount < 3) {
        const cell = Array.from(columnCells).find(c => !c.classList.contains('filled'));
        if (cell) {
          placeDice(2, cell, botDice);
          placed = true;
          break;
        }
      }
    }

    currentPlayer = 1;
    currentPlayerDisplay.textContent = 'Ход: Вы';
    updateScore();
    playerTurn(); // Автоматически бросаем кубик

    if (isGameOver()) {
      setTimeout(() => {
        const s1 = parseInt(score1.textContent);
        const s2 = parseInt(score2.textContent);
        let result = `Игра окончена!\nВы: ${s1}\nБот: ${s2}\n`;
        if (s1 > s2) result += "Вы победили!";
        else if (s2 > s1) result += "Бот победил!";
        else result += "Ничья!";
        alert(result);
      }, 100);
    }
  }, 1000);
}

// Подсчёт очков
function updateScore() {
  let total1 = 0, total2 = 0;

  for (let col = 0; col < 3; col++) {
    const cells1 = Array.from(document.querySelectorAll(`.dice-cell[data-player="1"][data-col="${col}"]`))
      .map(c => {
        const img = c.querySelector('img');
        if (img) {
          const match = img.src.match(/img_(\d)\.png$/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      }).filter(v => v > 0);

    const score1Col = calculateColumnScore(cells1);
    total1 += score1Col;
    document.getElementById(`col-1-${col}`).textContent = `(${score1Col})`;

    const cells2 = Array.from(document.querySelectorAll(`.dice-cell[data-player="2"][data-col="${col}"]`))
      .map(c => {
        const img = c.querySelector('img');
        if (img) {
          const match = img.src.match(/img_(\d)\.png$/);
          return match ? parseInt(match[1]) : 0;
        }
        return 0;
      }).filter(v => v > 0);

    const score2Col = calculateColumnScore(cells2);
    total2 += score2Col;
    document.getElementById(`col-2-${col}`).textContent = `(${score2Col})`;
  }

  score1.textContent = total1;
  score2.textContent = total2;
}

function calculateColumnScore(values) {
  if (values.length === 0) return 0;

  const counts = {};
  values.forEach(v => counts[v] = (counts[v] || 0) + 1);

  let total = 0;
  for (const numStr in counts) {
    const num = parseInt(numStr);
    const count = counts[num];
    const sum = num * count;

    if (count === 3) {
      total += sum * 3;
    } else if (count === 2) {
      total += sum * 2;
    } else {
      total += sum;
    }
  }

  return total;
}

function isBoardFull(player) {
  for (let col = 0; col < 3; col++) {
    const cells = document.querySelectorAll(`.dice-cell[data-player="${player}"][data-col="${col}"].filled`);
    if (cells.length < 3) return false;
  }
  return true;
}

function isGameOver() {
  return isBoardFull(1) || isBoardFull(2);
}

// Сброс игры
resetButton.addEventListener('click', () => {
  document.querySelectorAll('.dice-cell').forEach(cell => {
    cell.innerHTML = '';
    cell.classList.remove('filled', 'animate', 'remove-animation');
    cell.style.backgroundColor = '';
  });
  document.querySelectorAll('.column-score').forEach(el => el.textContent = '');

  diceElement.innerHTML = '?';
  currentPlayer = 1;
  currentPlayerDisplay.textContent = 'Ход: Вы';
  diceValue = null;
  score1.textContent = '0';
  score2.textContent = '0';

  // После сброса — сразу бросаем кубик
  setTimeout(playerTurn, 500);
});

// Запуск при загрузке
window.addEventListener('load', () => {
  currentPlayerDisplay.textContent = 'Ход: Вы';
  setTimeout(playerTurn, 800);
});