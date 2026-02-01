import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, AlertCircle, Check, X, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

export function AdminValidations() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [pendingLogs, setPendingLogs] = useState<FlightLog[]>([]);

    // Group logs by student
    const [groupedLogs, setGroupedLogs] = useState<Record<string, FlightLog[]>>({});

    useEffect(() => {
        if (!user || user.role !== 'admin') {
            navigate('/');
            return;
        }
        loadPendingFlights();
    }, [user, navigate]);

    const loadPendingFlights = () => {
        const allLogs = storageService.getLogs();
        const pending = allLogs.filter(l => !l.validationStatus || l.validationStatus === 'pending')
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

        setPendingLogs(pending);

        // Grouping
        const groups: Record<string, FlightLog[]> = {};
        pending.forEach(log => {
            const student = log.studentName || 'Desconocido';
            if (!groups[student]) groups[student] = [];
            groups[student].push(log);
        });
        setGroupedLogs(groups);
    };

    const handleValidate = async (logId: string) => {
        await storageService.validateFlight(logId, 'validated');
        loadPendingFlights(); // Refresh
    };

    const handleReject = async (logId: string) => {
        const feedback = prompt("Motivo del rechazo (opcional):") || "Sin especificar";
        await storageService.validateFlight(logId, 'rejected', feedback);
        loadPendingFlights(); // Refresh
    };

    const handleValidateBatch = async (studentName: string) => {
        if (!confirm(`¿Validar TODOS los vuelos pendientes de ${studentName}?`)) return;

        const logsToValidate = groupedLogs[studentName];
        for (const log of logsToValidate) {
            await storageService.validateFlight(log.id, 'validated');
        }
        loadPendingFlights();
    };

    const formatDuration = (minutes: number) => (minutes / 60).toFixed(1).replace('.', ',');

    const formatDateSafe = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy');
        } catch {
            return dateStr || 'Fecha inválida';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <ShieldCheck className="h-8 w-8 text-blue-600" />
                    Centro de Validaciones
                </h1>
                <p className="text-zinc-500 text-sm">Gestiona los vuelos pendientes de validación.</p>
            </div>

            {pendingLogs.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Todo al día</h3>
                    <p className="text-zinc-500">No hay vuelos pendientes de validación.</p>
                </div>
            ) : (
                <div className="space-y-8">
                    {Object.keys(groupedLogs).sort().map(studentName => (
                        <div key={studentName} className="space-y-3">
                            <div className="flex items-center justify-between sticky top-14 bg-zinc-50/95 dark:bg-zinc-950/95 backdrop-blur py-2 z-10 border-b border-zinc-200 dark:border-zinc-800">
                                <h2 className="text-lg font-bold flex items-center gap-2">
                                    <AlertCircle className="h-5 w-5 text-orange-500" />
                                    {studentName}
                                    <span className="text-xs font-normal text-zinc-500 bg-zinc-200 dark:bg-zinc-800 px-2 py-0.5 rounded-full">
                                        {groupedLogs[studentName].length} pendientes
                                    </span>
                                </h2>
                                <Button
                                    size="sm"
                                    onClick={() => handleValidateBatch(studentName)}
                                    className="bg-green-600 hover:bg-green-700 text-white"
                                >
                                    Validar Todos
                                </Button>
                            </div>

                            <div className="grid gap-3">
                                {groupedLogs[studentName].map(log => (
                                    <Card key={log.id} className="overflow-hidden border-zinc-200 dark:border-zinc-800">
                                        <CardContent className="p-3">
                                            <div className="flex flex-col sm:flex-row justify-between gap-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono font-bold text-zinc-500 text-xs px-1.5 py-0.5 bg-zinc-100 dark:bg-zinc-800 rounded">
                                                            {formatDateSafe(log.date)}
                                                        </span>
                                                        <span className="font-bold">{log.session} </span>
                                                        {log.flightType !== 'Real' && (
                                                            <span className="text-[10px] uppercase bg-blue-100 text-blue-700 px-1.5 rounded font-bold">
                                                                {log.flightType}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <div className="text-sm text-zinc-600 dark:text-zinc-400">
                                                        Inst: {log.instructorName} • {log.aircraft?.registration || 'N/A'} • {formatDuration(log.totalTime)}h
                                                    </div>
                                                    {(log.remarks || log.procedures) && (
                                                        <div className="mt-2 text-xs text-zinc-500 bg-zinc-50 dark:bg-zinc-900/50 p-2 rounded">
                                                            {log.procedures && <div className='mb-0.5'><span className='font-semibold'>Proc:</span> {log.procedures}</div>}
                                                            {log.remarks && <div><span className='font-semibold'>Obs:</span> {log.remarks}</div>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 sm:flex-col sm:justify-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 border-zinc-100 dark:border-zinc-800">
                                                    <button
                                                        onClick={() => handleValidate(log.id)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                                    >
                                                        <Check className="h-4 w-4" /> Validar
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(log.id)}
                                                        className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                                    >
                                                        <X className="h-4 w-4" /> Rechazar
                                                    </button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
