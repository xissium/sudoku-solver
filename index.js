// 动态生成数独格子
const tbody = document.querySelector('#sudoku-board tbody');
for (let i = 0; i < 9; i++) {
  const tr = document.createElement('tr');
  for (let j = 0; j < 9; j++) {
    const td = document.createElement('td');
    const input = document.createElement('input');
    input.type = 'text';
    input.maxLength = 1;
    input.pattern = '[1-9]';
    input.className = 'cell';
    // 只允许输入1-9
    input.addEventListener('input', function (e) {
      if (!/^[1-9]?$/.test(this.value)) {
        this.value = '';
      }
    });
    input.addEventListener('keydown', function (e) {
      // 允许删除、Tab、功能键等
      if (['Backspace', 'Delete', 'Tab'].includes(e.key) || e.key.length > 1) {
        return;
      }
      if (!/^[1-9]$/.test(e.key)) {
        e.preventDefault();
      }
    });
    td.appendChild(input);
    tr.appendChild(td);
  }
  tbody.appendChild(tr);
}

const cells = document.querySelectorAll('.cell');

// 设置初始盘面按钮
document.querySelector('.set-initial-btn').onclick = function () {
  cells.forEach(cell => {
    if (cell.value !== '') {
      cell.disabled = true;
      cell.classList.add('initial');
    }
  });
  this.disabled = true;
  this.classList.add('btn-disabled');
  saveGrid();
};

// 重置按钮
document.querySelector('.reset-btn').onclick = function () {
  cells.forEach(cell => {
    cell.value = '';
    cell.disabled = false;
    cell.classList.remove('initial');
  });
  document.querySelector('.set-initial-btn').disabled = false;
  document.querySelector('.set-initial-btn').classList.remove('btn-disabled');
  localStorage.removeItem('grid');
};

// 求解数独
function solveSudoku(grid) {
  const N = 9;
  const CELL_N = N * N;
  const CONSTRAINTS = 4 * CELL_N;
  const matrix = [];
  const rowMap = [];

  const blockIndex = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3);

  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      for (let d = 1; d <= N; d++) {
        if (grid[r][c] !== 0 && grid[r][c] !== d) continue;
        const row = Array(CONSTRAINTS).fill(0);
        row[r * N + c] = 1; // cell constraint
        row[CELL_N + r * N + (d - 1)] = 1; // row-digit
        row[2 * CELL_N + c * N + (d - 1)] = 1; // col-digit
        row[3 * CELL_N + blockIndex(r, c) * N + (d - 1)] = 1; // block-digit
        matrix.push(row);
        rowMap.push([r, c, d]);
      }
    }
  }

  const solver = new DancingLinks(matrix);
  let result = null;
  solver.solve(solution => {
    result = grid.map(r => r.slice());
    solution.forEach(idx => {
      const [r, c, d] = rowMap[idx];
      result[r][c] = d;
    });
  });
  return result;
}

// 求解按钮
document.querySelector('.solve-btn').onclick = function () {
  // 读取初始盘面
  const grid = [];
  let hasInitial = false;
  for (let i = 0; i < 9; i++) {
    const row = [];
    for (let j = 0; j < 9; j++) {
      const idx = i * 9 + j;
      const cell = cells[idx];
      if (cell.disabled && cell.value !== '') {
        row.push(Number(cell.value));
        hasInitial = true;
      } else {
        row.push(0);
      }
    }
    grid.push(row);
  }
  if (!hasInitial) {
    alert('请先设定初始盘面');
    return;
  }
  // 求解
  const result = solveSudoku(grid);
  if (!result) {
    alert('无解或盘面有误');
    return;
  }
  // 回填结果
  for (let i = 0; i < 9; i++) {
    for (let j = 0; j < 9; j++) {
      const idx = i * 9 + j;
      cells[idx].value = result[i][j] || '';
    }
  }
};

// 保存盘面
function saveGrid() {
  const grid = [];
  for (let i = 0; i < 9; i++) {
    const row = [];
    for (let j = 0; j < 9; j++) {
      const idx = i * 9 + j;
      row.push({
        value: cells[idx].value || '',
        initial: cells[idx].classList.contains('initial'),
        disabled: cells[idx].disabled,
      });
    }
    grid.push(row);
  }
  // 保存按钮状态
  const setInitialBtn = document.querySelector('.set-initial-btn');
  const btnState = {
    disabled: setInitialBtn.disabled,
    class: setInitialBtn.className,
  };
  localStorage.setItem('grid', JSON.stringify({ grid, btnState }));
}

cells.forEach(cell => {
  cell.addEventListener('input', saveGrid);
});

// 页面加载时恢复盘面
function loadGrid() {
  const data = localStorage.getItem('grid');
  if (!data) return;
  try {
    const parsed = JSON.parse(data);
    const grid = parsed.grid;
    for (let i = 0; i < 9; i++) {
      for (let j = 0; j < 9; j++) {
        const idx = i * 9 + j;
        const cellData = grid[i][j];
        cells[idx].value = cellData.value || '';
        if (cellData.initial) {
          cells[idx].classList.add('initial');
        } else {
          cells[idx].classList.remove('initial');
        }
        cells[idx].disabled = !!cellData.disabled;
      }
    }
    // 恢复按钮状态
    if (parsed.btnState) {
      const setInitialBtn = document.querySelector('.set-initial-btn');
      setInitialBtn.disabled = !!parsed.btnState.disabled;
      setInitialBtn.className = parsed.btnState.class;
    }
  } catch (e) {}
}
loadGrid();

// 选中时高亮
function getCellRC(cell) {
  const idx = Array.from(cells).indexOf(cell);
  return [Math.floor(idx / 9), idx % 9];
}

function highlightRelated(cell) {
  const [r, c] = getCellRC(cell);
  cells.forEach((other, i) => {
    const rr = Math.floor(i / 9);
    const cc = i % 9;
    // 同行、同列、同宫
    if (
      rr === r ||
      cc === c ||
      (Math.floor(rr / 3) === Math.floor(r / 3) && Math.floor(cc / 3) === Math.floor(c / 3))
    ) {
      other.classList.add('related');
    }
  });
}

function clearHighlight() {
  cells.forEach(cell => cell.classList.remove('related'));
}

cells.forEach(cell => {
  cell.addEventListener('focus', function () {
    clearHighlight();
    highlightRelated(this);
  });
  cell.addEventListener('blur', clearHighlight);
});
