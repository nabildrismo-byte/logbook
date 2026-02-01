import { useEffect, useState } from 'react'
import { storageService } from '@/services/storage'
import { STUDENTS, ORDERED_STUDENT_NAMES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { BarChart3 } from 'lucide-react'

export function FlightMeter() {
    const [stats, setStats] = useState<{ name: string; real: number; sim: number; total: number }[]>([]);

    // Goal Constants
    const GOAL_REAL = 45;
    const GOAL_SIM = 21;
    const GOAL_TOTAL = 66;

    useEffect(() => {
        const logs = storageService.getLogs();
        const studentStats: Record<string, { real: number; sim: number }> = {};

        // Initialize with 0 for all students in CONSTANTS to show even empty ones
        STUDENTS.forEach(student => {
            studentStats[student] = { real: 0, sim: 0 };
        });

        // Aggregate
        logs.forEach(log => {
            // ONLY COUNT VALIDATED FLIGHTS
            if (log.validationStatus !== 'validated') return;

            let name = log.studentName.trim();
            const match = STUDENTS.find(s => s.toUpperCase() === name.toUpperCase());
            const key = match || name;

            if (!studentStats[key]) {
                studentStats[key] = { real: 0, sim: 0 };
            }

            const minutes = log.totalTime || 0;
            if (log.flightType === 'Real') {
                studentStats[key].real += minutes;
            } else {
                studentStats[key].sim += minutes;
            }
        });

        const sortedStats = Object.entries(studentStats)
            .map(([name, { real, sim }]) => ({
                name,
                real: real / 60,
                sim: sim / 60,
                total: (real + sim) / 60
            }))
            .sort((a, b) => {
                const indexA = ORDERED_STUDENT_NAMES.indexOf(a.name);
                const indexB = ORDERED_STUDENT_NAMES.indexOf(b.name);
                // Handle cases where names might not be in the ordered list (append them)
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });

        setStats(sortedStats);
    }, []);

    const formatHours = (val: number) => val.toFixed(1).replace('.', ',');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Vuelímetro</h1>
            </div>

            <div className="grid gap-4">
                {stats.map((student) => (
                    <Card key={student.name} className="overflow-hidden">
                        <CardHeader className="p-3 pb-1 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                            <div className="flex justify-between items-baseline">
                                <CardTitle className="text-sm font-bold truncate pr-2">{student.name}</CardTitle>
                                <span className="text-lg font-bold font-mono">
                                    {formatHours(student.total)} <span className="text-xs text-zinc-400 font-normal">/ {GOAL_TOTAL}h</span>
                                </span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            {/* Real Hours Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-zinc-500">Real</span>
                                    <span className={student.real >= GOAL_REAL ? 'text-green-600' : 'text-zinc-700 dark:text-zinc-300'}>
                                        {formatHours(student.real)} / {GOAL_REAL}h
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${student.real >= GOAL_REAL ? 'bg-green-500' : 'bg-blue-500'}`}
                                        style={{ width: `${Math.min((student.real / GOAL_REAL) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Sim+Ent Hours Bar */}
                            <div className="space-y-1">
                                <div className="flex justify-between text-xs font-medium">
                                    <span className="text-zinc-500">Sim + Ent</span>
                                    <span className={student.sim >= GOAL_SIM ? 'text-green-600' : 'text-zinc-700 dark:text-zinc-300'}>
                                        {formatHours(student.sim)} / {GOAL_SIM}h
                                    </span>
                                </div>
                                <div className="h-2.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${student.sim >= GOAL_SIM ? 'bg-green-500' : 'bg-yellow-400'}`}
                                        style={{ width: `${Math.min((student.sim / GOAL_SIM) * 100, 100)}%` }}
                                    />
                                </div>
                            </div>

                            {/* Total Progress visual */}
                            <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 mt-2">
                                <div className="flex justify-between text-[10px] text-zinc-400 mb-1">
                                    <span>Progreso Total</span>
                                    <span>{Math.round((student.total / GOAL_TOTAL) * 100)}%</span>
                                </div>
                                <div className="h-1.5 w-full bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                                    <div className={`h-full ${student.total >= GOAL_TOTAL ? 'bg-green-500' : 'bg-zinc-400'}`} style={{ width: `${Math.min((student.total / GOAL_TOTAL) * 100, 100)}%` }} />
                                </div>
                            </div>

                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
