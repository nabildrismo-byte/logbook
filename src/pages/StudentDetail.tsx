import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Clock } from 'lucide-react'


export function StudentDetail() {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<FlightLog[]>([]);
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (name) {
            loadStudentData(name);
        }
    }, [name, user, navigate]);

    const loadStudentData = (studentNameEncoded: string) => {
        let studentName = studentNameEncoded;
        try {
            studentName = decodeURIComponent(studentNameEncoded);
        } catch (e) {
            console.error('Error decoding student name:', e);
        }

        const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const targetNameClean = removeAccents(studentName);

        const allLogs = storageService.getLogs();
        const studentLogs = allLogs
            .filter(l => {
                let logNameClean = removeAccents(l.studentName.trim());
                return logNameClean === targetNameClean;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        setLogs(studentLogs);
    };

    const formatDuration = (minutes: number) => {
        return (minutes / 60).toFixed(1).replace('.', ',');
    };

    if (!logs.length) {
        return (
            <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <div className="text-zinc-500 mb-2">No se encontraron vuelos para este alumno.</div>
                <div className="text-sm text-zinc-400">Nombre buscado: {name ? decodeURIComponent(name) : 'Desconocido'}</div>
            </div>
        );
    }

    // Stats calculation
    const totalMinutes = logs.reduce((acc, log) => acc + (log.totalTime || 0), 0);
    const realMinutes = logs.reduce((acc, log) => acc + (log.flightType === 'Real' ? (log.totalTime || 0) : 0), 0);
    const simTrainerMinutes = logs.reduce((acc, log) => acc + (['Simulador', 'Entrenador'].includes(log.flightType) ? (log.totalTime || 0) : 0), 0);

    // Grade stats - handle string mixed content
    const numericGrades = logs
        .map(l => parseFloat(l.grade))
        .filter(n => !isNaN(n));

    const avgGrade = numericGrades.length > 0
        ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
        : 0;

    const passedCount = logs.filter(l => {
        const n = parseFloat(l.grade);
        if (!isNaN(n)) return n >= 5;
        // Check for text "APTO"
        return l.grade.toUpperCase().includes('APTO') && !l.grade.toUpperCase().includes('NO');
    }).length;

    const failedCount = logs.length - passedCount;

    const getDecodedName = () => {
        try {
            return decodeURIComponent(name || '');
        } catch {
            return name || '';
        }
    }
    const displayName = getDecodedName();

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Expediente del Alumno</h2>
                        <h1 className="text-3xl font-bold">{displayName}</h1>
                    </div>
                </div>
            </div>

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-zinc-500">NOTA MEDIA</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className={`text-2xl font-bold ${avgGrade < 5 ? 'text-red-600' : 'text-green-600'}`}>
                            {avgGrade.toFixed(1)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/50">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-blue-600 dark:text-blue-400">TOTAL HORAS</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold">{formatDuration(totalMinutes)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/50">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-green-600 dark:text-green-400">REALES</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-300">{formatDuration(realMinutes)}</div>
                    </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-900/10 border-orange-100 dark:border-orange-900/50">
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-orange-600 dark:text-orange-400">SIM + ENT</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold text-orange-700 dark:text-orange-300">{formatDuration(simTrainerMinutes)}</div>
                    </CardContent>
                </Card>

                <Card className="bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/50">
                    <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold text-green-700 dark:text-green-400">APTOS</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">{passedCount}</div>
                    </CardContent>
                </Card>
                <Card className="bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/50">
                    <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold text-red-700 dark:text-red-400">NO APTOS</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold text-red-700 dark:text-red-400">{failedCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* MANEUVERS BREAKDOWN */}
            {logs.some(l => l.approaches && l.approaches.length > 0) && (
                <Card>
                    <CardHeader className="p-4 pb-2">
                        <CardTitle className="text-sm font-bold flex items-center gap-2">
                            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 p-1.5 rounded-md">
                                IFR
                            </span>
                            Desglose de Maniobras
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2">
                        <div className="space-y-1">
                            {(() => {
                                const stats: Record<string, { type: string, place: string, count: number }> = {};
                                logs.forEach(log => {
                                    if (log.approaches) {
                                        log.approaches.forEach(app => {
                                            const key = `${app.type}-${app.place || 'UNK'}`;
                                            if (!stats[key]) {
                                                stats[key] = {
                                                    type: app.type,
                                                    place: app.place || 'N/A',
                                                    count: 0
                                                };
                                            }
                                            stats[key].count += app.count;
                                        });
                                    }
                                });

                                return Object.values(stats)
                                    .sort((a, b) => b.count - a.count)
                                    .map((stat, idx) => (
                                        <div key={idx} className="flex justify-between items-center text-sm border-b border-dashed border-zinc-100 dark:border-zinc-800 last:border-0 py-2">
                                            <div className="flex gap-2">
                                                <span className="font-bold w-12">{stat.type}</span>
                                                <span className="text-zinc-500">en {stat.place}</span>
                                            </div>
                                            <span className="font-mono font-bold bg-zinc-100 dark:bg-zinc-800 px-2 rounded-full">
                                                {stat.count}
                                            </span>
                                        </div>
                                    ));
                            })()}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* FLIGHT HISTORY LIST */}
            <div>
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                    <Clock className="h-5 w-5 text-zinc-500" />
                    Histórico de Sesiones
                </h3>
                <div className="space-y-3">
                    {logs.map((log) => (
                        <div key={log.id} className="relative pl-6 pb-6 border-l border-zinc-200 dark:border-zinc-800 last:pb-0 last:border-l-0">
                            {/* Visual indicator logic: Green if >=5 or contains APTO (not NO), Red otherwise */}
                            <div className={`absolute top-0 left-[-5px] h-2.5 w-2.5 rounded-full ${(parseFloat(log.grade) >= 5 || (log.grade.toUpperCase().includes('APTO') && !log.grade.toUpperCase().includes('NO')))
                                ? 'bg-green-500'
                                : 'bg-red-500'
                                }`} />
                            <Card>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-lg flex items-center gap-2">
                                                {log.session}
                                                <span className="text-xs font-normal text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                                    {format(new Date(log.date), 'dd MMM yyyy')}
                                                </span>
                                            </div>
                                            <div className="text-sm text-zinc-500">{log.instructorName} • {log.aircraft.registration}</div>
                                        </div>
                                        <div className={`text-xl font-bold ${(parseFloat(log.grade) >= 5 || (log.grade.toUpperCase().includes('APTO') && !log.grade.toUpperCase().includes('NO')))
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                            }`}>
                                            {log.grade}
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                        <div>
                                            <span className="text-zinc-500 block text-xs">TIEMPO</span>
                                            <span className="font-mono font-medium">{formatDuration(log.totalTime)}</span>
                                        </div>
                                        <div>
                                            <span className="text-zinc-500 block text-xs">MANIOBRAS/OBS</span>
                                            <p className="line-clamp-2 text-zinc-700 dark:text-zinc-300">
                                                {log.procedures || log.remarks || '-'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
