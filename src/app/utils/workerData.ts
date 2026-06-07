// Worker data with behavior scores and monthly reset logic

export interface Worker {
  id: string;
  name: string;
  photo: string;
  behaviourScore: number;
  totalFine: number;
  status: "Active" | "Suspended";
  lastScoreReset?: string; // ISO date string of last reset
  monthlyViolations: number;
  department: string;
}

// Check if we need to reset scores (if current month is different from last reset)
export function shouldResetScore(lastReset: string | undefined): boolean {
  if (!lastReset) return true;
  
  const lastResetDate = new Date(lastReset);
  const currentDate = new Date();
  
  // Check if month or year has changed
  return (
    lastResetDate.getMonth() !== currentDate.getMonth() ||
    lastResetDate.getFullYear() !== currentDate.getFullYear()
  );
}

// Reset worker score to 100 if it's a new month
export function resetScoreIfNeeded(worker: Worker): Worker {
  if (shouldResetScore(worker.lastScoreReset)) {
    return {
      ...worker,
      behaviourScore: 100,
      lastScoreReset: new Date().toISOString(),
      monthlyViolations: 0,
    };
  }
  return worker;
}

// Get current month name for display
export function getCurrentMonthYear(): string {
  const date = new Date();
  return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}

// Mock worker data with last reset dates
export const mockWorkers: Worker[] = [
  {
    id: "W001",
    name: "Rajesh Kumar",
    photo: "https://images.unsplash.com/photo-1694522362256-6c907336af43?w=100",
    behaviourScore: 85,
    totalFine: 1200,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 3,
    department: "Construction",
  },
  {
    id: "W002",
    name: "Mohammed Ali",
    photo: "https://images.unsplash.com/photo-1582489851864-4b4bddaf6a1b?w=100",
    behaviourScore: 72,
    totalFine: 2500,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 5,
    department: "Maintenance",
  },
  {
    id: "W003",
    name: "Suresh Patel",
    photo: "https://images.unsplash.com/photo-1666137270524-5131ac07314d?w=100",
    behaviourScore: 98,
    totalFine: 300,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 1,
    department: "Electrical",
  },
  {
    id: "W004",
    name: "Vijay Singh",
    photo: "",
    behaviourScore: 45,
    totalFine: 5800,
    status: "Suspended",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 12,
    department: "Construction",
  },
  {
    id: "W005",
    name: "Arun Sharma",
    photo: "",
    behaviourScore: 92,
    totalFine: 900,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 2,
    department: "Safety",
  },
  {
    id: "W006",
    name: "Prakash Yadav",
    photo: "",
    behaviourScore: 62,
    totalFine: 3200,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 7,
    department: "Plumbing",
  },
  {
    id: "W007",
    name: "Ramesh Gupta",
    photo: "",
    behaviourScore: 95,
    totalFine: 600,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 1,
    department: "Electrical",
  },
  {
    id: "W008",
    name: "Deepak Verma",
    photo: "",
    behaviourScore: 38,
    totalFine: 6500,
    status: "Suspended",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 15,
    department: "Construction",
  },
  {
    id: "W009",
    name: "Kumar Patel",
    photo: "",
    behaviourScore: 88,
    totalFine: 1100,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 3,
    department: "Maintenance",
  },
  {
    id: "W010",
    name: "Arjun Reddy",
    photo: "",
    behaviourScore: 96,
    totalFine: 400,
    status: "Active",
    lastScoreReset: "2026-03-01T00:00:00.000Z",
    monthlyViolations: 1,
    department: "Safety",
  },
];

// Get workers with scores reset if needed
export function getWorkersWithResetScores(): Worker[] {
  return mockWorkers.map(resetScoreIfNeeded);
}

// Get best worker of the month (highest behavior score among active workers)
export function getBestWorker(): Worker | null {
  const workers = getWorkersWithResetScores();
  const activeWorkers = workers.filter(w => w.status === "Active");
  
  if (activeWorkers.length === 0) return null;
  
  return activeWorkers.reduce((best, current) => 
    current.behaviourScore > best.behaviourScore ? current : best
  );
}

// Get top 5 workers
export function getTopWorkers(count: number = 5): Worker[] {
  const workers = getWorkersWithResetScores();
  const activeWorkers = workers.filter(w => w.status === "Active");
  
  return activeWorkers
    .sort((a, b) => b.behaviourScore - a.behaviourScore)
    .slice(0, count);
}
