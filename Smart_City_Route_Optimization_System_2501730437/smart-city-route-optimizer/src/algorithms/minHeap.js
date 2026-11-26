/**
 * Binary Min-Heap Priority Queue for Dijkstra's algorithm.
 * Stores { id, priority } entries and orders them by minimum priority.
 */
export class MinHeap {
  constructor() {
    this.heap = [];
    this.pushCount = 0;
    this.popCount = 0;
  }

  size() {
    return this.heap.length;
  }

  isEmpty() {
    return this.heap.length === 0;
  }

  push(item) {
    this.pushCount++;
    this.heap.push(item);
    this._bubbleUp(this.heap.length - 1);
  }

  pop() {
    if (this.isEmpty()) return null;
    this.popCount++;
    const min = this.heap[0];
    const last = this.heap.pop();
    if (this.heap.length > 0) {
      this.heap[0] = last;
      this._sinkDown(0);
    }
    return min;
  }

  _bubbleUp(index) {
    let idx = index;
    const item = this.heap[idx];
    while (idx > 0) {
      const parentIdx = (idx - 1) >> 1;
      const parent = this.heap[parentIdx];
      if (item.priority >= parent.priority) break;
      this.heap[idx] = parent;
      idx = parentIdx;
    }
    this.heap[idx] = item;
  }

  _sinkDown(index) {
    let idx = index;
    const length = this.heap.length;
    const item = this.heap[idx];

    while (true) {
      const leftIdx = (idx << 1) + 1;
      const rightIdx = leftIdx + 1;
      let smallestIdx = idx;

      if (leftIdx < length && this.heap[leftIdx].priority < this.heap[smallestIdx].priority) {
        smallestIdx = leftIdx;
      }
      if (rightIdx < length && this.heap[rightIdx].priority < this.heap[smallestIdx].priority) {
        smallestIdx = rightIdx;
      }
      if (smallestIdx === idx) break;

      this.heap[idx] = this.heap[smallestIdx];
      this.heap[smallestIdx] = item;
      idx = smallestIdx;
    }
  }
}
