import { useEffect, useState } from 'react'
import { storageService } from '@/services/storage'
import { STUDENTS, ORDERED_STUDENT_NAMES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

import { authService } from '@/services/auth'

export function CourseTracker() {
    // Map: StudentName -> SessionKey ("VBAS-1") -> { status, totalTime }
    const [statusMap, setStatusMap] = useState<Record<string, Record<string, { status: string, totalTime?: number }>>>({});
    const [sortBy, setSortBy] = useState<'name' | 'progress'>('name');
    const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    // Set of "StudentName-SessionKey" that are flipped to show time
    const [flippedItems, setFlippedItems] = useState<Set<string>>(new Set());

    const user = authService.getCurrentUser();

    // Define Course Requirements
    const MODULES = [
        { code: 'VBAS', count: 12, label: 'Básico (VBAS)' },
        { code: 'VRAD', count: 20, label: 'Radio (VRAD)' },
        { code: 'VPRA', count: 16, label: 'Práctico (VPRA)' },
    ];

    // Merge with any other students in constants that might be missing from the specific list
    let ALL_STUDENTS = [
        ...ORDERED_STUDENT_NAMES,
        ...STUDENTS.filter(s => !ORDERED_STUDENT_NAMES.includes(s))
    ];

    // IF STUDENT: Filter list to only show them (and force only them selected/visible)
    if (user?.role === 'student') {
        ALL_STUDENTS = ALL_STUDENTS.filter(s => s.toUpperCase() === user.name.toUpperCase());
    }

    // Helper to calculate total progress %
    const calculateTotalProgress = (studentName: string) => {
        let totalSessions = 0;
        let completedSessions = 0;

        MODULES.forEach(m => {
            totalSessions += m.count;
            const completedInModule = new Array(m.count).fill(0).filter((_, i) =>
                statusMap[studentName]?.[`${m.code}-${i + 1}`]?.status === 'validated'
            ).length;
            completedSessions += completedInModule;
        });

        return totalSessions > 0 ? (completedSessions / totalSessions) : 0;
    };

    // Filter and Sort Students
    const displayedStudents = ALL_STUDENTS
        .filter(s => selectedStudents.length === 0 || selectedStudents.includes(s))
        .sort((a, b) => {
            if (sortBy === 'name') return a.localeCompare(b);
            if (sortBy === 'progress') {
                return calculateTotalProgress(b) - calculateTotalProgress(a);
            }
            return 0;
        });

    useEffect(() => {
        const logs = storageService.getLogs();
        const newStatusMap: Record<string, Record<string, { status: string, totalTime?: number }>> = {};

        // Init
        ALL_STUDENTS.forEach(s => newStatusMap[s] = {});

        logs.forEach(log => {
            let name = log.studentName.trim();
            const match = ALL_STUDENTS.find(s => s.toUpperCase() === name.toUpperCase());
            const key = match || name;

            if (match) { // Only track known students
                if (!newStatusMap[key]) newStatusMap[key] = {};

                // Normalize session format (e.g., "VBAS-1", "VBAS-01" -> "VBAS-1")
                if (log.session) {
                    const parts = log.session.split('-');
                    if (parts.length >= 2) {
                        const type = parts[0].toUpperCase();
                        const num = parseInt(parts[1], 10);
                        if (!isNaN(num)) {
                            const sessionKey = `${type}-${num}`;
                            // Determine status. Default to 'pending' if not set but exists.
                            const currentStatus = log.validationStatus || 'pending';

                            // Store object with status and totalTime
                            newStatusMap[key][sessionKey] = {
                                status: currentStatus,
                                totalTime: log.totalTime
                            };
                        }
                    }
                }
            }
        });

        setStatusMap(newStatusMap);
    }, []);

    const calculateProgress = (studentName: string, code: string, count: number) => {
        // Count ONLY sessions that are VALIDATED
        const completed = new Array(count).fill(0).filter((_, i) =>
            statusMap[studentName]?.[`${code}-${i + 1}`]?.status === 'validated'
        ).length;
        return Math.round((completed / count) * 100);
    };

    const toggleStudentSelection = (student: string) => {
        if (selectedStudents.includes(student)) {
            setSelectedStudents(prev => prev.filter(s => s !== student));
        } else {
            setSelectedStudents(prev => [...prev, student]);
        }
    };

    const handleSessionToggle = (studentName: string, sessionKey: string) => {
        const uniqueKey = `${studentName}-${sessionKey}`;
        setFlippedItems(prev => {
            const newSet = new Set(prev);
            if (newSet.has(uniqueKey)) {
                newSet.delete(uniqueKey);
            } else {
                newSet.add(uniqueKey);
            }
            return newSet;
        });
    };

    const formatDuration = (minutes?: number) => {
        if (!minutes) return '-';
        return (minutes / 60).toFixed(1).replace('.', ',');
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-2">
                    <GraduationCap className="h-6 w-6 text-blue-600" />
                    <h1 className="text-2xl font-bold">Progreso del Curso</h1>
                </div>

                {user?.role !== 'student' && (
                    <div className="flex items-center gap-2">
                        {/* FILTER DROPDOWN */}
                        <div className="relative">
                            <button
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-md border transition-colors ${selectedStudents.length > 0 ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700'}`}
                            >
                                <span>Filtrar Alumnos {selectedStudents.length > 0 && `(${selectedStudents.length})`}</span>
                            </button>

                            {isFilterOpen && (
                                <>
                                    <div className="fixed inset-0 z-40" onClick={() => setIsFilterOpen(false)} />
                                    <div className="absolute right-0 mt-2 w-56 max-h-80 overflow-y-auto bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg shadow-xl z-50 p-2">
                                        <div className="text-xs font-semibold text-zinc-500 mb-2 px-2">Selecciona alumnos:</div>
                                        {ALL_STUDENTS.map(student => (
                                            <label key={student} className="flex items-center gap-2 p-2 hover:bg-zinc-50 dark:hover:bg-zinc-800 rounded cursor-pointer text-sm">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedStudents.includes(student)}
                                                    onChange={() => toggleStudentSelection(student)}
                                                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                {student}
                                            </label>
                                        ))}
                                        {selectedStudents.length > 0 && (
                                            <button
                                                onClick={() => setSelectedStudents([])}
                                                className="w-full text-center text-xs text-red-500 hover:text-red-600 mt-2 py-1 border-t border-zinc-100 dark:border-zinc-800"
                                            >
                                                Limpiar Filtros
                                            </button>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>

                        {/* SORT SELECT */}
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-md px-2 py-1">
                            <span className="text-xs text-zinc-500">Ordenar:</span>
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="text-xs font-semibold bg-transparent border-none focus:ring-0 cursor-pointer"
                            >
                                <option value="name">Nombre</option>
                                <option value="progress">Progreso</option>
                            </select>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex gap-4 mb-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 flex-wrap">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div> Validada</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div> Pendiente</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div> Discrepancia</div>
            </div>

            <div className="grid gap-6">
                {displayedStudents.map(student => (
                    <Card key={student} className="overflow-hidden">
                        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 p-4">
                            <CardTitle className="text-lg font-bold flex justify-between items-center">
                                {student}
                                <span className="text-xs font-normal text-zinc-500 bg-white dark:bg-zinc-800 px-2 py-1 rounded border">
                                    {Math.round(calculateTotalProgress(student) * 100)}% Completado
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            {MODULES.map(module => {
                                const progress = calculateProgress(student, module.code, module.count);
                                const isComplete = progress === 100;

                                return (
                                    <div key={module.code} className="space-y-2">
                                        <div className="flex justify-between items-end mb-1">
                                            <h3 className="text-sm font-bold flex items-center gap-2">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    isComplete ? "bg-green-500" : "bg-blue-500"
                                                )} />
                                                {module.label}
                                            </h3>
                                            <span className="text-xs text-zinc-400 font-mono">
                                                {progress}%
                                            </span>
                                        </div>

                                        {/* Grid of Sessions */}
                                        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                                            {Array.from({ length: module.count }).map((_, i) => {
                                                const sessionNum = i + 1;
                                                const sessionKey = `${module.code}-${sessionNum}`;
                                                const sessionData = statusMap[student]?.[sessionKey];
                                                const status = sessionData?.status;

                                                const isFlipped = flippedItems.has(`${student}-${sessionKey}`);

                                                let bgClass = "bg-zinc-50 text-zinc-300 dark:bg-zinc-800/50 dark:text-zinc-600 border border-zinc-100 dark:border-zinc-800"; // Default (Empty)

                                                if (status === 'validated') {
                                                    bgClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800 cursor-pointer hover:bg-green-200 dark:hover:bg-green-900/40";
                                                } else if (status === 'rejected') {
                                                    bgClass = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800 cursor-pointer hover:bg-purple-200 dark:hover:bg-purple-900/40";
                                                } else if (status === 'pending') {
                                                    bgClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800 cursor-pointer hover:bg-orange-200 dark:hover:bg-orange-900/40";
                                                }

                                                return (
                                                    <div
                                                        key={sessionNum}
                                                        className={cn(
                                                            "h-8 flex items-center justify-center rounded text-xs font-mono font-medium transition-all select-none perspective-500",
                                                            bgClass,
                                                            isFlipped && "bg-blue-600 text-white border-blue-700 dark:bg-blue-600 dark:text-white shadow-md transform scale-105"
                                                        )}
                                                        onClick={() => status && handleSessionToggle(student, sessionKey)}
                                                        title={`${module.code}-${sessionNum}: ${status ? status.toUpperCase() : 'No realizada'}`}
                                                    >
                                                        {isFlipped ? (
                                                            <span className="text-[10px] font-bold">{formatDuration(sessionData?.totalTime)} HV</span>
                                                        ) : (
                                                            sessionNum
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    )
}
