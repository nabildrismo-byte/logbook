import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { buttonVariants } from '@/components/ui/Button'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog, LogbookStats } from '@/types'
import { Plus, FileText, RefreshCw, AlertCircle, Check, X } from 'lucide-react'
import { format } from 'date-fns'
import { cn } from '@/lib/utils'

export function Dashboard() {
    const navigate = useNavigate();
    const [stats, setStats] = useState<LogbookStats | null>(null);
    const [page, setPage] = useState(1);
    const ITEMS_PER_PAGE = 10;
    const [recentLogs, setRecentLogs] = useState<FlightLog[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const user = authService.getCurrentUser();
    const [pendingCount, setPendingCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');
    const [instructorFilter, setInstructorFilter] = useState<string>('all');
    const [sessionFilter, setSessionFilter] = useState<'all' | 'VBAS' | 'VRAD' | 'VPRA'>('all');
    const [dateSort, setDateSort] = useState<'asc' | 'desc'>('desc');
    const [availableInstructors, setAvailableInstructors] = useState<string[]>([]);

    const isStudent = user?.role === 'student';

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, navigate, page, statusFilter, instructorFilter, sessionFilter, dateSort]); // Reload when page or filter changes

    const loadData = () => {
        let allLogs = storageService.getLogs();

        // IF STUDENT: Filter logs to show only their own
        if (isStudent) {
            allLogs = allLogs.filter(l => l.studentName.toUpperCase() === user.name.toUpperCase());
            // Count pending
            const pending = allLogs.filter(l => !l.validationStatus || l.validationStatus === 'pending').length;
            setPendingCount(pending);

            // Extract Instructors (Unique)
            const instructors = Array.from(new Set(allLogs.map(l => l.instructorName).filter(Boolean))).sort();
            setAvailableInstructors(instructors);

            // Apply Status Filter for LIST (not for stats, stats usually show global progress, but user asked for "visibility and filter")
            // Actually, if I filter 'allLogs' here, it affects stats calculation below if I reuse 'allLogs'.
            // The student wants to SEE filtered logs.
            // Let's create a separate filtered array for display.


            // Calculate student stats manually since getStats() is global
            const studentStats = allLogs.reduce((acc, log) => {
                // If filtering for stats, ONLY VALIDATED
                if (log.validationStatus !== 'validated') return acc;

                const time = log.totalTime || 0;
                acc.totalHours += time;
                if (log.flightType === 'Real') acc.realHours += time;
                else if (log.flightType === 'Simulador') {
                    acc.simHours += time;
                    acc.simTrainerTotalHours += time;
                } else if (log.flightType === 'Entrenador') {
                    acc.trainerHours += time;
                    acc.simTrainerTotalHours += time;
                }
                return acc;
            }, {
                totalHours: 0, realHours: 0, simHours: 0, trainerHours: 0, simTrainerTotalHours: 0
            });
            setStats(studentStats);
        } else {
            // Instructor/Admin sees global stats
            setStats(storageService.getStats());
        }

        // Apply Status Filter
        if (statusFilter !== 'all') {
            allLogs = allLogs.filter(l => {
                const status = l.validationStatus || 'pending';
                if (statusFilter === 'pending') return status === 'pending';
                if (statusFilter === 'validated') return status === 'validated';
                if (statusFilter === 'rejected') return status === 'rejected';
                return true;
            });
        }

        // Apply Instructor Filter
        if (instructorFilter !== 'all') {
            allLogs = allLogs.filter(l => l.instructorName === instructorFilter);
        }

        // Apply Session Filter
        if (sessionFilter !== 'all') {
            allLogs = allLogs.filter(l => l.session.toUpperCase().startsWith(sessionFilter));
        }

        // Sort by Date
        const sortedLogs = allLogs.sort((a, b) => {
            const timeA = new Date(a.date || 0).getTime();
            const timeB = new Date(b.date || 0).getTime();
            return dateSort === 'desc' ? timeB - timeA : timeA - timeB;
        });

        setTotalPages(Math.ceil(sortedLogs.length / ITEMS_PER_PAGE));

        const start = (page - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        setRecentLogs(sortedLogs.slice(start, end));
    };



    const formatDuration = (minutes: number) => {
        return (minutes / 60).toFixed(1).replace('.', ',');
    };

    if (!stats) return <div className="p-4">Cargando...</div>;

    return (
        <div className="space-y-6">
            {/* ALERT FOR STUDENTS */}
            {isStudent && pendingCount > 0 && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700/50 rounded-lg p-4 flex items-center gap-3">
                    <AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
                    <div>
                        <h3 className="font-bold text-yellow-800 dark:text-yellow-200">Tienes {pendingCount} sesiones pendientes de validar</h3>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300">Por favor revisa tus vuelos recientes y confirma si son correctos.</p>
                    </div>
                </div>
            )}

            {/* STATS - Conditioned for Student vs General */}
            {!isStudent && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Card className="sm:col-span-2 bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
                        <CardHeader className="p-3 pb-1">
                            <CardTitle className="text-xs font-semibold text-blue-600 dark:text-blue-400">
                                TOTAL HORAS (GENERAL)
                            </CardTitle>
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
            )}

            <div className="space-y-4">
                {isStudent && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                            {/* Instructor Filter */}
                            <Select
                                value={instructorFilter}
                                onChange={(e) => setInstructorFilter(e.target.value)}
                                options={[
                                    { value: 'all', label: 'Todos los instructores' },
                                    ...availableInstructors.map(inst => ({ value: inst, label: inst }))
                                ]}
                            />

                            {/* Session Filter */}
                            <Select
                                value={sessionFilter}
                                onChange={(e) => setSessionFilter(e.target.value as any)}
                                options={[
                                    { value: 'all', label: 'Todas las sesiones' },
                                    { value: 'VBAS', label: 'VBAS' },
                                    { value: 'VRAD', label: 'VRAD' },
                                    { value: 'VPRA', label: 'VPRA' }
                                ]}
                            />

                            {/* Status Filter */}
                            <Select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                options={[
                                    { value: 'all', label: 'Todos los estados' },
                                    { value: 'pending', label: 'Pendientes' },
                                    { value: 'validated', label: 'Validados' },
                                    { value: 'rejected', label: 'Discrepancias' }
                                ]}
                            />

                            {/* Date Sort */}
                            <Select
                                value={dateSort}
                                onChange={(e) => setDateSort(e.target.value as any)}
                                options={[
                                    { value: 'desc', label: 'Más recientes primero' },
                                    { value: 'asc', label: 'Más antiguos primero' }
                                ]}
                            />
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2 mb-4">
                <button
                    onClick={async () => {
                        if (confirm('¿Descargar datos de la nube? Esto reemplazará los datos locales.')) {
                            const ok = await storageService.syncWithCloud();
                            if (ok) {
                                alert('Datos sincronizados correctamente.');
                                loadData(); // Refresh UI
                            } else {
                                alert('Error al sincronizar. Asegúrate de haber actualizado el Script de Google.');
                            }
                        }
                    }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 text-white bg-blue-600 hover:bg-blue-700 font-bold px-6 py-3 rounded-lg shadow-md transition-all active:scale-95"
                >
                    <RefreshCw className="h-5 w-5" />
                    Sincronizar base de datos
                </button>
                <div className="flex-1" /> {/* Spacer */}

                {!isStudent && (
                    <Link to="/add" className={buttonVariants('ghost', 'sm')}>
                        <Plus className="h-4 w-4 mr-1" /> Nuevo
                    </Link>
                )}
            </div>

            {recentLogs.length === 0 ? (
                <div className="text-center py-10 text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-lg">
                    <FileText className="h-10 w-10 mx-auto mb-2 opacity-20" />
                    <p>No hay vuelos registrados.</p>
                    {!isStudent && (
                        <Link to="/add" className={cn(buttonVariants('primary'), "mt-4")}>
                            <Plus className="mr-2 h-4 w-4" /> Registrar Vuelo
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-3">
                    {recentLogs.map((log) => {
                        const gradeUpper = String(log.grade).toUpperCase();
                        const isNoEvaluable = gradeUpper.includes('NO EVALUABLE');
                        const n = parseFloat(log.grade);
                        const isPassing = !isNaN(n) ? n >= 5 : (gradeUpper.includes('APTO') && !gradeUpper.includes('NO'));

                        // Validation Logic
                        const isPending = !log.validationStatus || log.validationStatus === 'pending';
                        const isValidated = log.validationStatus === 'validated';
                        const isRejected = log.validationStatus === 'rejected';

                        return (
                            <Card key={log.id} className="overflow-hidden">
                                <div className={cn(
                                    "flex border-b border-zinc-100 dark:border-zinc-800 p-2 px-4 justify-between items-center",
                                    isValidated ? "bg-green-50/50 dark:bg-green-900/20" :
                                        isRejected ? "bg-red-50/50 dark:bg-red-900/20" :
                                            "bg-zinc-50/50 dark:bg-zinc-900/50"
                                )}>
                                    <span className="text-xs font-semibold text-zinc-500">{format(new Date(log.date), 'dd/MM/yyyy')} — {log.session}</span>

                                    <div className="flex items-center gap-2">
                                        {/* Validation Status Badge */}
                                        {isValidated && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check className="h-3 w-3" /> Validado</span>}
                                        {isRejected && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><X className="h-3 w-3" /> Rechazado</span>}
                                        {isPending && isStudent && <span className="text-xs font-bold text-orange-600 animate-pulse">Pendiente Validar</span>}

                                        {/* Grade Display Logic */}
                                        {isPending ? (
                                            <span className="text-xs font-bold text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-200 dark:border-zinc-700">
                                                ---
                                            </span>
                                        ) : isNoEvaluable ? (
                                            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                                {log.grade}
                                            </span>
                                        ) : !isPassing ? (
                                            <span className="text-xs font-bold text-red-600 bg-red-100 dark:bg-red-900/40 px-2 py-0.5 rounded-full">
                                                {isStudent ? 'NO APTO' : `NO APTO (${log.grade})`}
                                            </span>
                                        ) : (
                                            <span className="text-xs font-bold text-green-600 bg-green-100 dark:bg-green-900/40 px-2 py-0.5 rounded-full">
                                                {isStudent ? 'APTO' : `APTO (${log.grade})`}
                                            </span>
                                        )}
                                    </div>
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
                                {isRejected && log.studentFeedback && (
                                    <div className="px-4 pb-4">
                                        <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-md">
                                            <strong>Motivo rechazo:</strong> {log.studentFeedback}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        );
                    })}

                    {/* Pagination Controls */}
                    <div className="flex justify-center gap-2 py-4">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
                        >
                            Anterior
                        </button>
                        <span className="px-4 py-2 text-sm font-medium">
                            Página {page} de {totalPages || 1}
                        </span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page >= totalPages}
                            className="px-4 py-2 text-sm font-medium rounded-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 disabled:opacity-50"
                        >
                            Siguiente
                        </button>
                    </div>
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

    )
}
