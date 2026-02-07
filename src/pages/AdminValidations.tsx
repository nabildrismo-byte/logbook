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
        if (!user || (user.role !== 'admin' && user.role !== 'instructor')) {
            navigate('/');
            return;
        }
        loadPendingFlights();
    }, [user?.id, navigate]);

    const loadPendingFlights = () => {
        const allLogs = storageService.getLogs();

        // Base Filter: Pending flights
        let pending = allLogs.filter(l => !l.validationStatus || l.validationStatus === 'pending')
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

        // INSTRUCTOR FILTER: Only show flights where they are the instructor
        if (user?.role === 'instructor') {
            const normalize = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
            const myNameNormalized = normalize(user.name);

            pending = pending.filter(l => {
                const logInstructor = normalize(l.instructorName || '');
                return logInstructor === myNameNormalized; // Exact match or include? exact seems safer for validation
            });
        }

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

    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        logId: string | null;
        grade: string;
        remarks: string;
        studentName: string; // for context
    }>({
        isOpen: false,
        logId: null,
        grade: '',
        remarks: '',
        studentName: ''
    });



    const openValidationModal = (log: FlightLog) => {
        setValidationModal({
            isOpen: true,
            logId: log.id,
            grade: '',
            remarks: '',
            studentName: log.studentName
        });
    };

    const closeValidationModal = () => {
        setValidationModal(prev => ({ ...prev, isOpen: false, logId: null }));
    };

    const handleConfirmValidation = async () => {
        if (!validationModal.logId) return;
        if (!validationModal.grade) {
            alert('Debes introducir una calificación.');
            return;
        }

        await storageService.validateFlight(
            validationModal.logId,
            'validated',
            undefined, // no rejection feedback
            validationModal.grade,
            validationModal.remarks
        );

        closeValidationModal();
        loadPendingFlights();
    };

    const handleReject = async (logId: string) => {
        const feedback = prompt("Motivo del rechazo (opcional):") || "Sin especificar";
        await storageService.validateFlight(logId, 'rejected', feedback);
        loadPendingFlights();
    };

    // const handleValidateBatch = async (studentName: string) => {
    //    // Batch validation assumes pass? Or maybe we disable batch for now since grades are needed?
    //    // User didn't specify batch behavior. 
    //    // Safer to ALERT that batch validation will set default grade? Or disable it.
    //    // Let's keep it but warn. Actually, better to disable batch if grading is required per flight.
    //    // User requirement: "Instructor introduces grade...". Batch makes this hard.
    //    // I will prompt: "This will validate all flights as APTO / 5.0? No, that's risky."
    //    // I'll disable batch loop logic and force individual validation for now to ensure grading.
    //    alert("La validación por lotes está deshabilitada temporalmente para asegurar la calificación individual de cada vuelo.");
    // };

    const formatDuration = (minutes: number) => (minutes / 60).toFixed(1).replace('.', ',');

    const formatDateSafe = (dateStr: string) => {
        try {
            return format(new Date(dateStr), 'dd/MM/yyyy');
        } catch {
            return dateStr || 'Fecha inválida';
        }
    };

    return (
        <div className="space-y-6 relative">
            {/* MODAL OVERLAY */}
            {validationModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl border-zinc-200 dark:border-zinc-800">
                        <CardContent className="p-6 space-y-4">
                            <h3 className="text-lg font-bold">Validar Vuelo - {validationModal.studentName}</h3>

                            {/* NO EVALUABLE TOGGLE */}
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="no-evaluable-admin"
                                    className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    checked={validationModal.grade === 'NO EVALUABLE'}
                                    onChange={(e) => {
                                        if (e.target.checked) {
                                            setValidationModal(prev => ({ ...prev, grade: 'NO EVALUABLE' }));
                                        } else {
                                            setValidationModal(prev => ({ ...prev, grade: '5' }));
                                        }
                                    }}
                                />
                                <label htmlFor="no-evaluable-admin" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
                                    Marcar como NO EVALUABLE
                                </label>
                            </div>

                            {validationModal.grade !== 'NO EVALUABLE' && (
                                <div className="space-y-4">
                                    <div className="text-center">
                                        <div className={`text-5xl font-bold font-mono transition-colors ${!validationModal.grade ? 'text-zinc-300' : parseFloat(validationModal.grade) < 5 ? 'text-red-500' : 'text-blue-600'
                                            }`}>
                                            {validationModal.grade || '0'}
                                        </div>
                                        <div className="text-sm font-medium text-zinc-400 mt-1">
                                            {validationModal.grade ? (parseFloat(validationModal.grade) < 5 ? 'NO APTO' : 'APTO') : 'Selecciona nota'}
                                        </div>
                                    </div>

                                    <div className="px-2 pb-2">
                                        <input
                                            type="range"
                                            min="0"
                                            max="10"
                                            step="0.5"
                                            value={parseFloat(validationModal.grade) || 0}
                                            onChange={(e) => setValidationModal(prev => ({ ...prev, grade: e.target.value }))}
                                            className="w-full h-2 bg-zinc-200 rounded-lg appearance-none cursor-pointer dark:bg-zinc-700 accent-blue-600"
                                        />
                                        <div className="flex justify-between text-xs text-zinc-400 mt-2 font-mono">
                                            <span>0</span>
                                            <span>5</span>
                                            <span>10</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Observaciones (Feedback)</label>
                                <textarea
                                    className="w-full p-2 border rounded min-h-[80px] dark:bg-zinc-800 dark:border-zinc-700"
                                    placeholder="Comentarios"
                                    value={validationModal.remarks}
                                    onChange={(e) => setValidationModal(prev => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" onClick={closeValidationModal} className="flex-1">Cancelar</Button>
                                <Button onClick={handleConfirmValidation} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                                    <Check className="mr-2 h-4 w-4" /> Confirmar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

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
                                {/* Batch disabled for safety with new flow */}
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
                                                            {/* Remarks might be empty if student added it. */}
                                                            {log.remarks && <div><span className='font-semibold'>Obs:</span> {log.remarks}</div>}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-2 sm:flex-col sm:justify-center border-t sm:border-t-0 sm:border-l pt-3 sm:pt-0 sm:pl-4 border-zinc-100 dark:border-zinc-800">
                                                    {/* Only allow actions if Pending OR if User is Admin */}
                                                    {(user?.role === 'admin' || (!log.validationStatus || log.validationStatus === 'pending')) && (
                                                        <>
                                                            <button
                                                                onClick={() => openValidationModal(log)}
                                                                className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                                            >
                                                                <ShieldCheck className="h-4 w-4" /> {log.validationStatus === 'validated' ? 'Editar' : 'Calificar'}
                                                            </button>

                                                            {log.validationStatus !== 'rejected' && (
                                                                <button
                                                                    onClick={() => handleReject(log.id)}
                                                                    className="flex-1 sm:flex-none flex items-center justify-center gap-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                                                                >
                                                                    <X className="h-4 w-4" /> Rechazar
                                                                </button>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Message if Instructor sees validated/rejected item (shouldnt happen due to filter, but safely) */}
                                                    {user?.role === 'instructor' && log.validationStatus && log.validationStatus !== 'pending' && (
                                                        <span className="text-xs text-zinc-400 font-medium text-center">
                                                            {log.validationStatus === 'validated' ? 'Validado' : 'Rechazado'}
                                                        </span>
                                                    )}
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
