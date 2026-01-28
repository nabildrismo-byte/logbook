import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { buttonVariants } from '@/components/ui/Button'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog, LogbookStats } from '@/types'
import { Plus, FileText } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<LogbookStats | null>(null);
    const [recentLogs, setRecentLogs] = useState<FlightLog[]>([]);
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = () => {
        setStats(storageService.getStats());
        setRecentLogs(storageService.getLogs().slice(0, 10)); // Show last 10
    };

    const formatDuration = (minutes: number) => {
        return (minutes / 60).toFixed(1).replace('.', ',');
    };

    if (!stats) return <div className="p-4">Cargando...</div>;

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="sm:col-span-2 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-blue-600 dark:text-blue-400">TOTAL HORAS (GENERAL)</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-3xl font-bold">{formatDuration(stats.totalHours)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/50">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-green-600 dark:text-green-400">REALES</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold text-green-700 dark:text-green-300">{formatDuration(stats.realHours)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/50">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-orange-600 dark:text-orange-400">SIM + ENT</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold text-orange-700 dark:text-orange-300">{formatDuration(stats.simTrainerTotalHours)}</div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-medium text-zinc-500">SIMULADOR</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">{formatDuration(stats.simHours)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-medium text-zinc-500">ENTRENADOR</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-xl font-bold">{formatDuration(stats.trainerHours)}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold">Últimos Vuelos</h2>
                    <Link to="/add" className={buttonVariants('ghost', 'sm')}>
                        <Plus className="h-4 w-4 mr-1" /> Nuevo
                    </Link>
                </div>

                {recentLogs.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                        <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>No hay vuelos registrados.</p>
                        <Link to="/add" className={cn(buttonVariants('primary'), "mt-4")}>
                            <Plus className="mr-2 h-4 w-4" /> Registrar Vuelo
                        </Link>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentLogs.map((log) => {
                            // Check grade logic for color
                            const n = parseFloat(log.grade);
                            const isPassing = !isNaN(n) ? n >= 5 : (log.grade.toUpperCase().includes('APTO') && !log.grade.toUpperCase().includes('NO'));

                            return (
                                <Card key={log.id} className="overflow-hidden">
                                    <div className="flex border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-2 px-4 justify-between items-center">
                                        <span className="text-xs font-semibold text-zinc-500">{format(new Date(log.date), 'dd/MM/yyyy')} — {log.session}</span>
                                        {!isPassing ? (
                                            <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">NO APTO ({log.grade})</span>
                                        ) : (
                                            <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">APTO ({log.grade})</span>
                                        )}
                                    </div>
                                    <div className="p-4 flex items-start justify-between">
                                        <div>
                                            <div className="font-bold text-lg">{log.studentName}</div>
                                            <div className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
                                                <span className="font-medium text-zinc-700 dark:text-zinc-300">{log.aircraft.registration}</span> • {log.instructorName}
                                            </div>
                                            <div className="text-xs text-zinc-400 mt-2">
                                                {log.departure.place} → {log.arrival.place}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-xl">{formatDuration(log.totalTime)}</div>
                                            {log.conditions.ifr ? (
                                                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium mt-1">IFR {formatDuration(log.conditions.ifr)}</div>
                                            ) : null}
                                            {log.approaches.length > 0 && (
                                                <div className="text-xs text-zinc-500 mt-1">{log.approaches[0].count}x {log.approaches[0].type}</div>
                                            )}
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                )}

                {user?.role === 'admin' && (
                    <div className="pt-8 border-t border-zinc-200 dark:border-zinc-800">
                        <button
                            onClick={() => {
                                if (confirm('¿ESTÁS SEGURO? Se borrarán TODOS los vuelos de la base de datos local del dispositivo. Esta acción no se puede deshacer.')) {
                                    storageService.clearLogs();
                                    loadData();
                                }
                            }}
                            className="w-full text-center text-xs text-red-500 hover:text-red-600 font-medium py-4 opacity-50 hover:opacity-100 transition-opacity"
                        >
                            BORRAR BASE DE DATOS LOCAL
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
