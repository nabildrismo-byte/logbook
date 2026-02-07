import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Select } from '@/components/ui/Select'
import { Button } from '@/components/ui/Button'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog } from '@/types'
import { format } from 'date-fns'
import { CheckCircle2, XCircle, Clock, Check, X, AlertCircle, ShieldCheck } from 'lucide-react'


export function StudentDetail() {
    const { name } = useParams<{ name: string }>();
    const navigate = useNavigate();
    const [logs, setLogs] = useState<FlightLog[]>([]);
    const [sessionFilter, setSessionFilter] = useState<'all' | 'VBAS' | 'VRAD' | 'VPRA'>('all');
    const [gradeFilter, setGradeFilter] = useState<'all' | 'apto' | 'no-apto' | 'no-evaluable'>('all');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'validated' | 'rejected'>('all');
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        if (name) {
            loadStudentData(name);
        }
    }, [name, user?.id, navigate]);

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
            .sort((a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime());

        setLogs(studentLogs);
    };

    const formatDuration = (minutes: number) => {
        return (minutes / 60).toFixed(1).replace('.', ',');
    };

    const [validationModal, setValidationModal] = useState<{
        isOpen: boolean;
        logId: string | null;
        grade: string;
        remarks: string;
        studentName: string;
    }>({
        isOpen: false,
        logId: null,
        grade: '',
        remarks: '',
        studentName: ''
    });



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

    // Filter out "NO EVALUABLE" for stats (Case insensitive check)
    const evaluableLogs = logs.filter(l => !l.grade.toUpperCase().includes('NO EVALUABLE'));
    const noEvaluableCount = logs.length - evaluableLogs.length;

    // Grade stats - handle string mixed content
    const numericGrades = evaluableLogs
        .map(l => parseFloat(l.grade))
        .filter(n => !isNaN(n));

    const avgGrade = numericGrades.length > 0
        ? numericGrades.reduce((a, b) => a + b, 0) / numericGrades.length
        : 0;

    const passedCount = evaluableLogs.filter(l => {
        const n = parseFloat(l.grade);
        if (!isNaN(n)) return n >= 5;
        // Check for text "APTO" (excluding "NO APTO")
        // "VPRA" check is implicit here as they use text grades
        return l.grade.toUpperCase().includes('APTO') && !l.grade.toUpperCase().includes('NO APTO');
    }).length;

    const failedCount = evaluableLogs.length - passedCount;

    const getDecodedName = () => {
        try {
            return decodeURIComponent(name || '');
        } catch {
            return name || '';
        }
    }
    const displayName = getDecodedName();

    const handleFilterClick = (filter: 'apto' | 'no-apto' | 'no-evaluable') => {
        if (gradeFilter === filter) {
            setGradeFilter('all');
        } else {
            setGradeFilter(filter);
        }
    };



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
        loadStudentData(name || '');
    };

    return (
        <div className="space-y-6 relative">
            {/* VALIDATION MODAL OVERLAY */}
            {validationModal.isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <Card className="w-full max-w-md bg-white dark:bg-zinc-900 shadow-xl border-zinc-200 dark:border-zinc-800">
                        <CardContent className="p-6 space-y-6">
                            <h3 className="text-lg font-bold">Validar Vuelo</h3>

                            {/* NO EVALUABLE TOGGLE */}
                            <div className="flex items-center gap-2 mb-4">
                                <input
                                    type="checkbox"
                                    id="no-evaluable"
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
                                <label htmlFor="no-evaluable" className="text-sm font-medium text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
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
                                    className="w-full p-3 border rounded-md min-h-[100px] dark:bg-zinc-800 dark:border-zinc-700 text-sm"
                                    placeholder="Comentarios"
                                    value={validationModal.remarks}
                                    onChange={(e) => setValidationModal(prev => ({ ...prev, remarks: e.target.value }))}
                                />
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button variant="outline" onClick={closeValidationModal} className="flex-1">Cancelar</Button>
                                <Button onClick={handleConfirmValidation} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold">
                                    <Check className="mr-2 h-4 w-4" /> Confirmar
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-start">
                    <div>
                        <h2 className="text-sm font-medium text-zinc-500 uppercase tracking-wider">Expediente del Alumno</h2>
                        <h1 className="text-3xl font-bold">{displayName}</h1>
                    </div>
                </div>
            </div>

            {/* ADMIN CONTROLS */}
            {user?.role === 'admin' && logs.some(l => l.validationStatus === 'pending' || !l.validationStatus) && (
                <div className="bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-200 dark:border-yellow-900 p-4 rounded-lg flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="bg-yellow-100 p-2 rounded-full dark:bg-yellow-900/30">
                            <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                        </div>
                        <div>
                            <h3 className="font-bold text-sm text-yellow-800 dark:text-yellow-200">Acciones Pendientes</h3>
                            <p className="text-xs text-yellow-600 dark:text-yellow-400">Hay vuelos pendientes de validar.</p>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            if (!confirm('ATENCIÓN: La validación por lotes no asignará calificación. ¿Deseas continuar? Se asignará APTO por defecto.')) return;
                            const pendingIds = logs.filter(l => !l.validationStatus || l.validationStatus === 'pending').map(l => l.id);

                            for (const id of pendingIds) {
                                await storageService.validateFlight(id, 'validated', undefined, 'APTO', 'Validación masiva');
                            }
                            // Reload
                            loadStudentData(name || '');
                        }}
                        className="bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-bold px-4 py-2 rounded-md transition-colors shadow-sm"
                    >
                        Validar Todos
                    </button>
                </div>
            )}

            {/* SUMMARY CARDS */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <Card>
                    <CardHeader className="p-3 pb-1">
                        <CardTitle className="text-xs font-semibold text-zinc-500">NOTA MEDIA</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        {/* Hide Average Grade for Students */}
                        {user?.role === 'student' ? (
                            <div className="text-2xl font-bold text-zinc-400">---</div>
                        ) : (
                            <div className={`text-2xl font-bold ${avgGrade < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                {avgGrade.toFixed(1)}
                            </div>
                        )}
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

                <Card
                    className={`cursor-pointer transition-all ${gradeFilter === 'apto' ? 'ring-2 ring-green-500 ring-offset-2 dark:ring-offset-zinc-950 scale-105 shadow-lg' : 'hover:scale-[1.02]'} bg-green-50 dark:bg-green-900/10 border-green-100 dark:border-green-900/50`}
                    onClick={() => handleFilterClick('apto')}
                >
                    <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold text-green-700 dark:text-green-400">APTOS</CardTitle>
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold text-green-700 dark:text-green-400">{passedCount}</div>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all ${gradeFilter === 'no-apto' ? 'ring-2 ring-red-500 ring-offset-2 dark:ring-offset-zinc-950 scale-105 shadow-lg' : 'hover:scale-[1.02]'} bg-red-50 dark:bg-red-900/10 border-red-100 dark:border-red-900/50`}
                    onClick={() => handleFilterClick('no-apto')}
                >
                    <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold text-red-700 dark:text-red-400">NO APTOS</CardTitle>
                        <XCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold text-red-700 dark:text-red-400">{failedCount}</div>
                    </CardContent>
                </Card>
                <Card
                    className={`cursor-pointer transition-all md:col-span-3 lg:col-span-1 ${gradeFilter === 'no-evaluable' ? 'ring-2 ring-zinc-400 ring-offset-2 dark:ring-offset-zinc-950 scale-105 shadow-lg' : 'hover:scale-[1.02]'} bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700`}
                    onClick={() => handleFilterClick('no-evaluable')}
                >
                    <CardHeader className="p-3 pb-1 flex flex-row items-center justify-between space-y-0">
                        <CardTitle className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">NO EVAL</CardTitle>
                        <span className="h-4 w-4 rounded-full bg-zinc-300 dark:bg-zinc-600" />
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                        <div className="text-2xl font-bold text-zinc-700 dark:text-zinc-300">{noEvaluableCount}</div>
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
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-4">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <Clock className="h-5 w-5 text-zinc-500" />
                        Histórico de Sesiones
                    </h3>

                    <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                        <div className="w-full sm:w-40">
                            <Select
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                value={statusFilter}
                                options={[
                                    { value: 'all', label: 'Todos los estados' },
                                    { value: 'pending', label: 'Pendientes' },
                                    { value: 'validated', label: 'Validados' },
                                    { value: 'rejected', label: 'Discrepancias' }
                                ]}
                            />
                        </div>
                        <div className="w-full sm:w-40">
                            <Select
                                onChange={(e) => setSessionFilter(e.target.value as any)}
                                value={sessionFilter}
                                options={[
                                    { value: 'all', label: 'Todas las sesiones' },
                                    { value: 'VBAS', label: 'VBAS' },
                                    { value: 'VRAD', label: 'VRAD' },
                                    { value: 'VPRA', label: 'VPRA' }
                                ]}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    {logs.filter(log => {
                        // 1. Filter by Session Type
                        let sessionMatch = true;
                        if (sessionFilter !== 'all') {
                            sessionMatch = log.session.toUpperCase().startsWith(sessionFilter);
                        }
                        if (!sessionMatch) return false;

                        // 2. Filter by Status (New)
                        if (statusFilter !== 'all') {
                            const status = log.validationStatus || 'pending';
                            if (statusFilter === 'pending' && status !== 'pending') return false;
                            if (statusFilter === 'validated' && status !== 'validated') return false;
                            if (statusFilter === 'rejected' && status !== 'rejected') return false;
                        }

                        // 3. Filter by Grade Status (Interactive Cards)
                        if (gradeFilter === 'all') return true;

                        const gradeUpper = log.grade?.toUpperCase() || '';
                        const isNoEval = gradeUpper.includes('NO EVALUABLE');

                        if (gradeFilter === 'no-evaluable') return isNoEval;

                        // Parse numeric grade or check text grade
                        const numGrade = parseFloat(log.grade);
                        let isPass = false;
                        if (!isNaN(numGrade)) {
                            isPass = numGrade >= 5;
                        } else {
                            // Text based check
                            isPass = gradeUpper.includes('APTO') && !gradeUpper.includes('NO');
                        }

                        if (gradeFilter === 'apto') return !isNoEval && isPass;
                        if (gradeFilter === 'no-apto') return !isNoEval && !isPass;

                        return true;

                    }).map((log) => {
                        const isPending = !log.validationStatus || log.validationStatus === 'pending';
                        const isValidated = log.validationStatus === 'validated';
                        const isRejected = log.validationStatus === 'rejected';

                        // Handle missing grade for display logic
                        const gradeDisplay = log.grade || '';
                        const gradeUpper = gradeDisplay.toUpperCase();

                        return (
                            <div key={log.id} className="relative pl-6 pb-6 border-l border-zinc-200 dark:border-zinc-800 last:pb-0 last:border-l-0">
                                {/* Visual indicator logic */}
                                <div className={`absolute top-0 left-[-5px] h-2.5 w-2.5 rounded-full ${gradeUpper.includes('NO EVALUABLE')
                                    ? 'bg-zinc-400'
                                    : !gradeDisplay
                                        ? 'bg-zinc-300'
                                        : (parseFloat(gradeDisplay) >= 5 || (gradeUpper.includes('APTO') && !gradeUpper.includes('NO')))
                                            ? 'bg-green-500'
                                            : 'bg-red-500'
                                    }`} />
                                <Card className={isRejected ? 'border-red-300 dark:border-red-800' : ''}>
                                    <div className="absolute top-2 right-2">
                                        {isValidated && <span className="text-[10px] font-bold text-white bg-green-500 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><Check className="h-3 w-3" /> VALIDADO</span>}
                                        {isRejected && <span className="text-[10px] font-bold text-white bg-red-500 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm"><X className="h-3 w-3" /> RECHAZADO</span>}
                                        {isPending && <span className="text-[10px] font-bold text-orange-600 bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full flex items-center gap-1 border border-orange-200 dark:border-orange-800 text-center">PENDIENTE VALIDAR</span>}
                                    </div>

                                    <CardContent className="p-4 pt-5">
                                        <div className="flex justify-between items-start mb-2">
                                            <div>
                                                <div className="font-bold text-lg flex items-center gap-2">
                                                    {log.session}
                                                    <span className="text-xs font-semibold text-zinc-500">
                                                        {(() => {
                                                            try {
                                                                return format(new Date(log.date), 'dd/MM/yyyy');
                                                            } catch {
                                                                return log.date;
                                                            }
                                                        })()}
                                                    </span>
                                                </div>
                                                <div className="text-sm text-zinc-500"><span className="font-medium text-zinc-700 dark:text-zinc-300">{log.aircraft?.registration || 'N/A'}</span> • {log.instructorName}</div>
                                            </div>

                                            {/* Hide Grade for Students */}
                                            {user?.role === 'student' ? (
                                                <div className="text-xl font-bold text-zinc-300">
                                                    ***
                                                </div>
                                            ) : (
                                                <div className={`text-xl font-bold ${gradeUpper.includes('NO EVALUABLE')
                                                    ? 'text-zinc-500'
                                                    : !gradeDisplay
                                                        ? 'text-zinc-300'
                                                        : (parseFloat(gradeDisplay) >= 5 || (gradeUpper.includes('APTO') && !gradeUpper.includes('NO')))
                                                            ? 'text-green-600'
                                                            : 'text-red-600'
                                                    }`}>
                                                    {gradeDisplay || '---'}
                                                </div>
                                            )}
                                        </div>

                                        {isRejected && log.studentFeedback && (
                                            <div className="bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 text-sm p-3 rounded-md mb-2 mt-2">
                                                <strong>Motivo rechazo:</strong> {log.studentFeedback}
                                            </div>
                                        )}

                                        <div className="grid grid-cols-2 gap-4 text-sm mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800">
                                            <div>
                                                <span className="text-zinc-500 block text-xs">TIEMPO</span>
                                                <span className="font-mono font-medium">{formatDuration(log.totalTime)}</span>
                                            </div>
                                            <div>
                                                <span className="text-zinc-500 block text-xs">MANIOBRAS/OBS</span>
                                                <button
                                                    onClick={(e) => {
                                                        const el = e.currentTarget;
                                                        el.classList.toggle('line-clamp-2');
                                                        el.classList.toggle('line-clamp-none');
                                                    }}
                                                    className="text-left w-full line-clamp-2 text-zinc-700 dark:text-zinc-300 active:opacity-70 transition-opacity"
                                                >
                                                    {log.procedures ? (
                                                        <span><span className="font-semibold">Proc:</span> {log.procedures} </span>
                                                    ) : null}
                                                    {user?.role !== 'student' && log.remarks ? (
                                                        <span><span className="font-semibold">Obs:</span> {log.remarks}</span>
                                                    ) : null}
                                                    {!log.procedures && (!log.remarks || user?.role === 'student') && '-'}
                                                </button>
                                            </div>
                                        </div>
                                    </CardContent>
                                    {/* ACTIONS FOOTER */}
                                    {/* Admin can always edit. Instructors can only validate their OWN flights that are PENDING. */}
                                    {(user?.role === 'admin' || (user?.role === 'instructor' && isPending && log.instructorName === user.name)) && (
                                        <div className="border-t border-zinc-100 dark:border-zinc-800 mt-4 pt-3 flex gap-2">
                                            <button
                                                onClick={() => openValidationModal(log)}
                                                className="flex-1 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 dark:bg-green-900/20 dark:border-green-800 dark:text-green-300 px-3 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                            >
                                                <ShieldCheck className="h-3 w-3" /> {user?.role === 'admin' && isValidated ? 'Editar Nota' : 'Validar'}
                                            </button>

                                            {/* Only show Reject if not already rejected, or if Admin */}
                                            {(user?.role === 'admin' || !isRejected) && (
                                                <button
                                                    onClick={async () => {
                                                        const reason = prompt('Motivo del rechazo:');
                                                        if (reason) {
                                                            await storageService.validateFlight(log.id, 'rejected', reason);
                                                            loadStudentData(name || '');
                                                        }
                                                    }}
                                                    className="flex-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300 px-3 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-1 transition-colors"
                                                >
                                                    <X className="h-3 w-3" /> {isRejected ? 'Cambiar motivo' : 'Rechazar'}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </Card>
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}
