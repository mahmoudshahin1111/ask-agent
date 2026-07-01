class AgentMemory {
  constructor() {
    this.goal = null;
    this.subtasks = [];
    this.results = [];
  }

  setGoal(goal) {
    this.goal = goal;
  }

  addSubtasks(tasks) {
    this.subtasks = tasks;
  }

  addResult(subtask, result) {
    this.results.push({ subtask, result });
  }

  getSummary() {
    return this.results
      .map((r, i) => `Step ${i + 1} — ${r.subtask}:\n${r.result}`)
      .join("\n\n");
  }

  reset() {
    this.goal = null;
    this.subtasks = [];
    this.results = [];
  }
}

const memory = new AgentMemory();

export { memory, AgentMemory };
