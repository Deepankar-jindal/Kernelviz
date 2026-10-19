import type { Process, SchedulerResult, GanttSlot, ScheduledProcess } from '../types';

function buildSchedulerResult(
  gantt: GanttSlot[],
  results: ScheduledProcess[],
  processes: Process[],
  totalTime: number,
  contextSwitches: number
): SchedulerResult {
  const totalBurst = processes.reduce((s, p) => s + p.burstTime, 0);
  const count = results.length || 1;
  let totalWait = 0;
  let totalTurnaround = 0;
  let totalResponse = 0;

  for (let i = 0; i < results.length; i++) {
    totalWait += results[i].waitingTime;
    totalTurnaround += results[i].turnaroundTime;
    totalResponse += results[i].responseTime;
  }

  return {
    gantt,
    processes: results,
    avgWaitingTime: totalWait / count,
    avgTurnaroundTime: totalTurnaround / count,
    avgResponseTime: totalResponse / count,
    cpuUtilization: totalTime > 0 ? (totalBurst / totalTime) * 100 : 0,
    contextSwitches,
    throughput: totalTime > 0 ? results.length / totalTime : 0,
  };
}

export function runFCFS(processes: Process[]): SchedulerResult {
  const sorted = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));
  const gantt: GanttSlot[] = [];
  const results: ScheduledProcess[] = [];
  let time = 0;
  let contextSwitches = 0;
  let lastPid = '';

  for (const p of sorted) {
    if (time < p.arrivalTime) {
      gantt.push({ pid: 'IDLE', startTime: time, endTime: p.arrivalTime, isIdle: true });
      time = p.arrivalTime;
    }
    if (lastPid && lastPid !== p.pid) contextSwitches++;
    const start = time;
    time += p.burstTime;
    gantt.push({ pid: p.pid, startTime: start, endTime: time });
    results.push({
      ...p,
      startTime: start,
      endTime: time,
      completionTime: time,
      turnaroundTime: time - p.arrivalTime,
      waitingTime: start - p.arrivalTime,
      responseTime: start - p.arrivalTime,
      remainingTime: 0,
    });
    lastPid = p.pid;
  }

  return buildSchedulerResult(gantt, results, processes, time, contextSwitches);
}

export function runSJF(processes: Process[]): SchedulerResult {
  const procs = processes.map(p => ({ ...p, remaining: p.burstTime, done: false, started: false, startTime: -1 }));
  const gantt: GanttSlot[] = [];
  let time = 0;
  let completed = 0;
  let contextSwitches = 0;
  let lastPid = '';
  const n = procs.length;

  while (completed < n) {
    const available = procs.filter(p => !p.done && p.arrivalTime <= time);
    if (available.length === 0) {
      const next = procs.filter(p => !p.done).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      gantt.push({ pid: 'IDLE', startTime: time, endTime: next.arrivalTime, isIdle: true });
      time = next.arrivalTime;
      continue;
    }
    const shortest = available.sort((a, b) => a.remaining - b.remaining || a.arrivalTime - b.arrivalTime)[0];
    if (!shortest.started) { shortest.started = true; shortest.startTime = time; }
    if (lastPid && lastPid !== shortest.pid) contextSwitches++;
    lastPid = shortest.pid;
    gantt.push({ pid: shortest.pid, startTime: time, endTime: time + shortest.remaining });
    time += shortest.remaining;
    shortest.remaining = 0;
    shortest.done = true;
    completed++;
  }

  const results: ScheduledProcess[] = procs.map(p => {
    const ct = gantt.filter(g => g.pid === p.pid).reduce((m, g) => Math.max(m, g.endTime), 0);
    const st = p.startTime;
    return { ...p, startTime: st, endTime: ct, completionTime: ct, turnaroundTime: ct - p.arrivalTime, waitingTime: ct - p.arrivalTime - p.burstTime, responseTime: st - p.arrivalTime, remainingTime: 0 };
  });

  return buildSchedulerResult(gantt, results, processes, time, contextSwitches);
}

export function runSRTF(processes: Process[]): SchedulerResult {
  const procs = processes.map(p => ({ ...p, remaining: p.burstTime, done: false, startTime: -1, firstRun: false }));
  const gantt: GanttSlot[] = [];
  let time = 0;
  let completed = 0;
  let contextSwitches = 0;
  let lastPid = '';
  const maxTime = processes.reduce((s, p) => s + p.burstTime, 0) + Math.max(...processes.map(p => p.arrivalTime)) + 1;

  while (completed < procs.length && time < maxTime) {
    const available = procs.filter(p => !p.done && p.arrivalTime <= time);
    if (available.length === 0) { time++; continue; }
    const current = available.sort((a, b) => a.remaining - b.remaining || a.arrivalTime - b.arrivalTime)[0];
    if (!current.firstRun) { current.firstRun = true; current.startTime = time; }
    if (lastPid !== current.pid && lastPid !== '') contextSwitches++;
    lastPid = current.pid;
    const lastSlot = gantt[gantt.length - 1];
    if (lastSlot && lastSlot.pid === current.pid && lastSlot.endTime === time) lastSlot.endTime++;
    else gantt.push({ pid: current.pid, startTime: time, endTime: time + 1 });
    current.remaining--;
    time++;
    if (current.remaining === 0) { current.done = true; completed++; }
  }

  const results: ScheduledProcess[] = procs.map(p => {
    const ct = gantt.filter(g => g.pid === p.pid).reduce((m, g) => Math.max(m, g.endTime), 0);
    return { ...p, startTime: p.startTime, endTime: ct, completionTime: ct, turnaroundTime: ct - p.arrivalTime, waitingTime: ct - p.arrivalTime - p.burstTime, responseTime: p.startTime - p.arrivalTime, remainingTime: 0 };
  });

  return buildSchedulerResult(gantt, results, processes, time, contextSwitches);
}

export function runRoundRobin(processes: Process[], quantum: number): SchedulerResult {
  const q = Math.max(1, quantum);
  const procs = processes.map(p => ({ ...p, remaining: p.burstTime, startTime: -1, done: false }));
  const gantt: GanttSlot[] = [];
  const queue: typeof procs = [];
  let time = 0;
  let completed = 0;
  let contextSwitches = 0;
  let lastPid = '';
  const added = new Set<string>();

  const addArrived = () => {
    procs.filter(p => !p.done && !added.has(p.pid) && p.arrivalTime <= time)
      .sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid))
      .forEach(p => { queue.push(p); added.add(p.pid); });
  };

  addArrived();
  while (completed < procs.length) {
    if (queue.length === 0) {
      const next = procs.filter(p => !p.done && !added.has(p.pid)).sort((a, b) => a.arrivalTime - b.arrivalTime)[0];
      if (!next) break;
      gantt.push({ pid: 'IDLE', startTime: time, endTime: next.arrivalTime, isIdle: true });
      time = next.arrivalTime;
      addArrived();
      continue;
    }
    const p = queue.shift()!;
    if (p.startTime === -1) p.startTime = time;
    if (lastPid && lastPid !== p.pid) contextSwitches++;
    lastPid = p.pid;
    const run = Math.min(q, p.remaining);
    gantt.push({ pid: p.pid, startTime: time, endTime: time + run });
    time += run;
    p.remaining -= run;
    addArrived();
    if (p.remaining === 0) { p.done = true; completed++; }
    else queue.push(p);
  }

  const results: ScheduledProcess[] = procs.map(p => {
    const ct = gantt.filter(g => g.pid === p.pid).reduce((m, g) => Math.max(m, g.endTime), 0);
    return { ...p, endTime: ct, completionTime: ct, turnaroundTime: ct - p.arrivalTime, waitingTime: ct - p.arrivalTime - p.burstTime, responseTime: p.startTime - p.arrivalTime, remainingTime: 0 };
  });

  return buildSchedulerResult(gantt, results, processes, time, contextSwitches);
}

export function runPriority(processes: Process[]): SchedulerResult {
  const procs = processes.map(p => ({ ...p, remaining: p.burstTime, done: false, startTime: -1, firstRun: false }));
  const gantt: GanttSlot[] = [];
  let time = 0;
  let completed = 0;
  let contextSwitches = 0;
  let lastPid = '';
  const maxTime = processes.reduce((s, p) => s + p.burstTime, 0) + Math.max(...processes.map(p => p.arrivalTime)) + 1;

  while (completed < procs.length && time < maxTime) {
    const available = procs.filter(p => !p.done && p.arrivalTime <= time);
    if (available.length === 0) { time++; continue; }
    const current = available.sort((a, b) => a.priority - b.priority || a.arrivalTime - b.arrivalTime)[0];
    if (!current.firstRun) { current.firstRun = true; current.startTime = time; }
    if (lastPid !== current.pid && lastPid !== '') contextSwitches++;
    lastPid = current.pid;
    const lastSlot = gantt[gantt.length - 1];
    if (lastSlot && lastSlot.pid === current.pid && lastSlot.endTime === time) lastSlot.endTime++;
    else gantt.push({ pid: current.pid, startTime: time, endTime: time + 1 });
    current.remaining--;
    time++;
    if (current.remaining === 0) { current.done = true; completed++; }
  }

  const results: ScheduledProcess[] = procs.map(p => {
    const ct = gantt.filter(g => g.pid === p.pid).reduce((m, g) => Math.max(m, g.endTime), 0);
    return { ...p, endTime: ct, completionTime: ct, turnaroundTime: ct - p.arrivalTime, waitingTime: ct - p.arrivalTime - p.burstTime, responseTime: p.startTime - p.arrivalTime, remainingTime: 0 };
  });

  return buildSchedulerResult(gantt, results, processes, time, contextSwitches);
}
