class DLXNode {
  constructor() {
    this.left = this;
    this.right = this;
    this.up = this;
    this.down = this;
    this.column = null;
    this.rowIndex = null;
    this.colIndex = null;
  }
}

class ColumnNode extends DLXNode {
  constructor() {
    super();
    this.size = 0;
    this.column = this;
  }
}

class DancingLinks {
  /**
   * @param {number[][]} matrix array of arrays of 0/1 representing exact cover matrix
   */
  constructor(matrix) {
    this.header = new ColumnNode();
    this.columns = [];
    const columnCount = matrix[0].length;

    let prev = this.header;
    for (let i = 0; i < columnCount; i++) {
      const colNode = new ColumnNode();
      this.columns.push(colNode);
      prev.right = colNode;
      colNode.left = prev;
      prev = colNode;
    }
    prev.right = this.header;
    this.header.left = prev;

    matrix.forEach((rowArr, r) => {
      let firstNodeInRow = null;
      rowArr.forEach((cell, c) => {
        if (cell != 1) return;
        const col = this.columns[c];
        const node = new DLXNode();
        node.column = col;
        node.rowIndex = r;
        node.colIndex = c;

        // vertical link into column
        node.down = col;
        node.up = col.up;
        col.up.down = node;
        col.up = node;
        col.size++;

        // horizontal link in row
        if (!firstNodeInRow) {
          firstNodeInRow = node;
          node.left = node;
          node.right = node;
        } else {
          node.right = firstNodeInRow;
          node.left = firstNodeInRow.left;
          firstNodeInRow.left.right = node;
          firstNodeInRow.left = node;
        }
      });
    });

    this.solution = [];
  }

  /**
   * cover a column and its rows
   * @param {ColumnNode} col
   */
  cover(col) {
    col.right.left = col.left;
    col.left.right = col.right;
    for (let row = col.down; row !== col; row = row.down) {
      for (let node = row.right; node !== row; node = node.right) {
        node.down.up = node.up;
        node.up.down = node.down;
        node.column.size--;
      }
    }
  }

  /**
   * uncover a column (reverse of cover)
   * @param {ColumnNode} col
   */
  uncover(col) {
    for (let row = col.up; row !== col; row = row.up) {
      for (let node = row.left; node !== row; node = node.left) {
        node.column.size++;
        node.down.up = node;
        node.up.down = node;
      }
    }
    col.right.left = col;
    col.left.right = col;
  }

  /**
   * recursive search for exact cover
   * @param {number} depth - current recursion depth
   * @param {function} onSolution - callback with solution array
   * @returns {boolean} found solution or not
   */
  search(depth = 0, onSolution) {
    if (this.header.right === this.header) {
      // found a complete solution
      onSolution(this.solution.slice());
      return true;
    }

    let targetCol = null;
    let minSize = Infinity;
    for (let col = this.header.right; col !== this.header; col = col.right) {
      if (col.size < minSize) {
        minSize = col.size;
        targetCol = col;
      }
    }

    // no solution
    if (!targetCol || targetCol.size === 0) return false;

    this.cover(targetCol);
    for (let row = targetCol.down; row !== targetCol; row = row.down) {
      this.solution[depth] = row.rowIndex;
      for (let node = row.right; node !== row; node = node.right) {
        this.cover(node.column);
      }
      if (this.search(depth + 1, onSolution)) return true;
      for (let node = row.left; node !== row; node = node.left) {
        this.uncover(node.column);
      }
    }
    this.uncover(targetCol);
    return false;
  }

  /**
   * @param {function} onSolution
   */
  solve(onSolution) {
    this.search(0, onSolution);
  }
}
