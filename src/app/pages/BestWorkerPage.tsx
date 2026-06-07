import { Award, TrendingUp, Calendar, Users, Trophy, Medal, Star } from "lucide-react";
import { Card } from "../components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import { getBestWorker, getTopWorkers, getCurrentMonthYear, type Worker } from "../utils/workerData";

export function BestWorkerPage() {
  const bestWorker = getBestWorker();
  const topWorkers = getTopWorkers(5);
  const currentMonthYear = getCurrentMonthYear();

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-[#059669]";
    if (score >= 80) return "text-[#0891B2]";
    if (score >= 70) return "text-[#D97706]";
    return "text-[#DC2626]";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 90) return "bg-[#059669]";
    if (score >= 80) return "bg-[#0891B2]";
    if (score >= 70) return "bg-[#D97706]";
    return "bg-[#DC2626]";
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return <Star className="w-5 h-5 text-gray-400" />;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Best Worker of the Month</h1>
        <p className="text-gray-500">
          Recognizing excellence and outstanding performance for {currentMonthYear}
        </p>
      </div>

      {/* Best Worker Spotlight */}
      {bestWorker && (
        <Card className="overflow-hidden bg-gradient-to-br from-[#0F172A] via-[#1E293B] to-[#0891B2] p-8 text-white shadow-2xl">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 to-yellow-600 rounded-full blur-lg opacity-50 animate-pulse"></div>
              <Avatar className="w-40 h-40 border-4 border-yellow-400 shadow-2xl relative">
                <AvatarImage src={bestWorker.photo} />
                <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-4xl">
                  {bestWorker.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-2 -right-2 bg-yellow-400 rounded-full p-3 shadow-xl">
                <Trophy className="w-8 h-8 text-yellow-900" />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                <Badge className="bg-yellow-400 text-yellow-900 hover:bg-yellow-400">
                  🏆 Winner
                </Badge>
                <Badge className="bg-white/20 text-white">{currentMonthYear}</Badge>
              </div>
              <h2 className="text-4xl font-bold mb-2">{bestWorker.name}</h2>
              <p className="text-cyan-200 text-lg mb-4">Worker ID: {bestWorker.id} • {bestWorker.department}</p>
              
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-cyan-200 text-sm mb-1">Behaviour Score</p>
                  <p className="text-3xl font-bold">{bestWorker.behaviourScore}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-cyan-200 text-sm mb-1">Violations</p>
                  <p className="text-3xl font-bold">{bestWorker.monthlyViolations}</p>
                </div>
                <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
                  <p className="text-cyan-200 text-sm mb-1">Total Fine</p>
                  <p className="text-3xl font-bold">₹{bestWorker.totalFine}</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Key Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#06B6D4] to-[#0891B2] flex items-center justify-center">
              <Calendar className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Current Month</p>
              <p className="text-xl font-bold text-gray-900">{currentMonthYear}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#059669] to-[#047857] flex items-center justify-center">
              <Users className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Active Workers</p>
              <p className="text-xl font-bold text-gray-900">{topWorkers.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#D97706] to-[#B45309] flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Avg Score</p>
              <p className="text-xl font-bold text-gray-900">
                {Math.round(topWorkers.reduce((sum, w) => sum + w.behaviourScore, 0) / topWorkers.length)}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-gray-500 text-sm">Score Reset</p>
              <p className="text-sm font-semibold text-gray-900">Monthly (1st)</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Top 5 Leaderboard */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Top Performers Leaderboard</h3>
            <p className="text-sm text-gray-500">Highest behaviour scores this month</p>
          </div>
          <Badge className="bg-gradient-to-r from-[#06B6D4] to-[#0891B2] text-white">
            {currentMonthYear}
          </Badge>
        </div>

        <div className="space-y-4">
          {topWorkers.map((worker, index) => (
            <div
              key={worker.id}
              className={`flex items-center gap-4 p-4 rounded-lg transition-all ${
                index === 0 
                  ? "bg-gradient-to-r from-yellow-50 to-yellow-100 border-2 border-yellow-400" 
                  : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center justify-center w-12 h-12">
                {getRankIcon(index + 1)}
              </div>

              <Avatar className="w-14 h-14 border-2 border-white shadow-md">
                <AvatarImage src={worker.photo} />
                <AvatarFallback className="bg-gradient-to-br from-[#06B6D4] to-[#0891B2] text-white">
                  {worker.name.split(" ").map(n => n[0]).join("")}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-gray-900">{worker.name}</p>
                  {index === 0 && <Trophy className="w-4 h-4 text-yellow-600" />}
                </div>
                <p className="text-sm text-gray-500">{worker.id} • {worker.department}</p>
              </div>

              <div className="text-right">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-2xl font-bold ${getScoreColor(worker.behaviourScore)}`}>
                    {worker.behaviourScore}
                  </span>
                  <span className="text-gray-400">/100</span>
                </div>
                <Progress value={worker.behaviourScore} className="w-32 h-2" />
              </div>

              <div className="text-center px-4">
                <p className="text-xs text-gray-500 mb-1">Violations</p>
                <Badge variant="outline" className="font-semibold">
                  {worker.monthlyViolations}
                </Badge>
              </div>

              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">Total Fine</p>
                <p className="font-semibold text-[#DC2626]">₹{worker.totalFine.toLocaleString()}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Info Card */}
      <Card className="p-6 bg-gradient-to-r from-[#06B6D4]/10 to-[#0891B2]/10 border-l-4 border-[#06B6D4]">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 rounded-lg bg-[#06B6D4] flex items-center justify-center flex-shrink-0">
            <Award className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">Monthly Score Reset Information</h4>
            <p className="text-sm text-gray-600 leading-relaxed">
              All behaviour scores are automatically reset to <span className="font-semibold">100</span> at the start of each month. 
              This ensures fair competition and gives every worker a fresh start. The best worker is determined based on 
              the highest behaviour score maintained throughout the month, considering violations, safety compliance, and overall performance.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
