import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, AlertCircle, Calendar } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function MyFlights() {
    const navigate = useNavigate();
    const user = authService.getCurrentUser();
    const [logs, setLogs] = useState<FlightLog[]>([]);
    const [filter, setFilter] = useState<'all' | 'validated' | 'pending' | 'rejected'>('all'); // Default to show all, or 'pending'? User usually wants to act on pending first. But 'all' is safer default.

    const filteredLogs = logs.filter(log => {
        if (filter === 'all') return true;
        const status = log.validationStatus || 'pending';
        return status === filter;
    });

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadMyFlights();
    }, [user, navigate]);

    const loadMyFlights = () => {
        const allLogs = storageService.getLogs();
        // Filter by Instructor Name (case insensitive)
        const myLogs = allLogs.filter(l =>
            l.instructorName.toUpperCase().includes(user?.name.toUpperCase() || '')
        ).sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

        setLogs(myLogs);
    };

    const formatDuration = (minutes: number) => (minutes / 60).toFixed(1).replace('.', ',');

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-blue-600" />
                    Mis Vuelos Instruidos
                </h1>

                <div className="w-full sm:w-48">
                    <Select
                        onChange={(e) => setFilter(e.target.value as any)}
                        value={filter}
                        options={[
                            { value: 'all', label: 'Todos los estados' },
                            { value: 'pending', label: 'Pendientes' },
                            { value: 'validated', label: 'Validados' },
                            { value: 'rejected', label: 'Rechazados' }
                        ]}
                    />
                </div>
            </div>

            {filteredLogs.length === 0 ? (
                <div className="p-8 text-center bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800">
                    <p className="text-zinc-500">No hay vuelos que coincidan con el filtro.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {filteredLogs.map(log => {
                        const status = log.validationStatus || 'pending';

                        return (
                            <Card key={log.id} className="overflow-hidden">
                                <div className={`flex border-b border-zinc-100 dark:border-zinc-800 p-2 px-4 justify-between items-center ${status === 'validated' ? 'bg-green-50 dark:bg-green-900/10' :
                                    status === 'rejected' ? 'bg-red-50 dark:bg-red-900/10' :
                                        'bg-orange-50 dark:bg-orange-900/10'
                                    }`}>
                                    <span className="text-xs font-semibold text-zinc-500">
                                        {format(new Date(log.date), 'dd/MM/yyyy')} — {log.session}
                                    </span>
                                    <div className="flex items-center gap-2">
                                        {status === 'validated' && <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Validado</span>}
                                        {status === 'rejected' && <span className="text-xs font-bold text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" /> Rechazado</span>}
                                        {status === 'pending' && <span className="text-xs font-bold text-orange-600 flex items-center gap-1"><AlertCircle className="h-3 w-3" /> Pendiente</span>}
                                    </div>
                                </div>
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-lg">{log.studentName}</div>
                                            <div className="text-sm text-zinc-500">
                                                <span className="font-medium text-zinc-700 dark:text-zinc-300">{log.aircraft?.registration || 'N/A'}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="font-mono font-bold text-xl">{formatDuration(log.totalTime)}</div>
                                            <div className="text-xs text-zinc-400">{log.flightType}</div>
                                        </div>
                                    </div>

                                    {status === 'rejected' && log.studentFeedback && (
                                        <div className="mt-3 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-md">
                                            <strong>Feedback del Alumno:</strong> {log.studentFeedback}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
