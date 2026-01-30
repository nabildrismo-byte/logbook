import { useEffect, useState } from 'react'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { INSTRUCTORS } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Medal } from 'lucide-react'

interface InstructorStats {
    name: string;
    real: number;
    sim: number;
    ent: number;
    total: number;
}

export function Instructors() {
    const [stats, setStats] = useState<InstructorStats[]>([]);

    useEffect(() => {
        // Verify Admin role here.
        const currentUser = authService.getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            // Redirect to home if not admin
            window.location.href = '/';
            return;
        }

        const logs = storageService.getLogs();
        const instructorStats: Record<string, InstructorStats> = {};

        // Initialize from constants
        INSTRUCTORS.forEach(name => {
            instructorStats[name] = { name, real: 0, sim: 0, ent: 0, total: 0 };
        });

        logs.forEach(log => {
            if (!log.instructorName) return;

            // Normalize instructor name (trim, uppercase)
            // We assume logs store standardized names, but let's be safe or just use flexible matching if needed.
            // For now, exact match against constant or fallback to creating new entry.
            let name = log.instructorName.trim();

            // Try to find matching constant (case insensitive)
            const constantMatch = INSTRUCTORS.find(i => i.toUpperCase() === name.toUpperCase());
            const key = constantMatch || name;

            if (!instructorStats[key]) {
                instructorStats[key] = { name: key, real: 0, sim: 0, ent: 0, total: 0 };
            }

            const mins = log.totalTime || 0;
            const type = log.flightType; // 'Real', 'Simulador', 'Entrenador'

            if (type === 'Real') {
                instructorStats[key].real += mins;
            } else if (type === 'Simulador') {
                instructorStats[key].sim += mins;
            } else if (type === 'Entrenador') {
                instructorStats[key].ent += mins;
            }

            instructorStats[key].total += mins;
        });

        // Convert to array and sort by Total Hours Descending
        const sorted = Object.values(instructorStats).sort((a, b) => b.total - a.total);
        setStats(sorted);

    }, []);

    const formatHours = (mins: number) => (mins / 60).toFixed(1).replace('.', ',');

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <Medal className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Instructores</h1>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {stats.map(inst => (
                    <Card key={inst.name}>
                        <CardHeader className="p-4 pb-2 bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800">
                            <CardTitle className="flex justify-between items-center text-lg">
                                {inst.name}
                                <span className="text-sm font-mono font-bold bg-white dark:bg-zinc-800 px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700">
                                    {formatHours(inst.total)}h Total
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-medium">Real</span>
                                <span className="font-bold text-blue-600 dark:text-blue-400">{formatHours(inst.real)}h</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-blue-500 h-full" style={{ width: `${Math.min((inst.real / (inst.total || 1)) * 100, 100)}%` }} />
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-medium">Simulador</span>
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatHours(inst.sim)}h</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-orange-400 h-full" style={{ width: `${Math.min((inst.sim / (inst.total || 1)) * 100, 100)}%` }} />
                            </div>

                            <div className="flex justify-between items-center text-sm">
                                <span className="text-zinc-500 font-medium">Entrenador</span>
                                <span className="font-bold text-zinc-700 dark:text-zinc-300">{formatHours(inst.ent)}h</span>
                            </div>
                            <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                                <div className="bg-yellow-400 h-full" style={{ width: `${Math.min((inst.ent / (inst.total || 1)) * 100, 100)}%` }} />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            {/* LOGIN HISTORY */}
            <div className="mt-12">
                <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="bg-zinc-100 dark:bg-zinc-800 p-1 rounded">🛡️</span>
                    Registro de Accesos
                </h2>
                <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
                    <div className="max-h-[300px] overflow-y-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-left sticky top-0">
                                <tr>
                                    <th className="p-3 font-medium text-zinc-500">Instructor</th>
                                    <th className="p-3 font-medium text-zinc-500">Fecha/Hora</th>
                                </tr>
                            </thead>
                            <tbody>
                                {(() => {
                                    // @ts-ignore - Dynamically using new method
                                    const history = authService.getLoginHistory ? authService.getLoginHistory() : [];
                                    if (history.length === 0) return <tr><td colSpan={2} className="p-4 text-center text-zinc-400">Sin registros recientes</td></tr>;

                                    return history.map((entry: any, index: number) => (
                                        <tr key={index} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0 hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                                            <td className="p-3 font-medium">{entry.name}</td>
                                            <td className="p-3 text-zinc-500 font-mono text-xs">
                                                {new Date(entry.timestamp).toLocaleDateString()} {new Date(entry.timestamp).toLocaleTimeString()}
                                            </td>
                                        </tr>
                                    ));
                                })()}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    )
}
