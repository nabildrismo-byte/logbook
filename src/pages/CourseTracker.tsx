import { useEffect, useState } from 'react'
import { storageService } from '@/services/storage'
import { STUDENTS, ORDERED_STUDENT_NAMES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

import { authService } from '@/services/auth'

export function CourseTracker() {
    // Map: StudentName -> SessionKey ("VBAS-1") -> Status
    const [statusMap, setStatusMap] = useState<Record<string, Record<string, string>>>({});
    const user = authService.getCurrentUser();

    // Define Course Requirements
    const MODULES = [
        { code: 'VBAS', count: 12, label: 'Básico (VBAS)' },
        { code: 'VRAD', count: 20, label: 'Radio (VRAD)' },
        { code: 'VPRA', count: 16, label: 'Práctico (VPRA)' },
    ];

    // Merge with any other students in constants that might be missing from the specific list
    let SORTED_STUDENTS = [
        ...ORDERED_STUDENT_NAMES,
        ...STUDENTS.filter(s => !ORDERED_STUDENT_NAMES.includes(s))
    ];

    // IF STUDENT: Filter list to only show them
    if (user?.role === 'student') {
        SORTED_STUDENTS = SORTED_STUDENTS.filter(s => s.toUpperCase() === user.name.toUpperCase());
    }

    useEffect(() => {
        const logs = storageService.getLogs();
        const newStatusMap: Record<string, Record<string, string>> = {};

        // Init
        SORTED_STUDENTS.forEach(s => newStatusMap[s] = {});

        logs.forEach(log => {
            let name = log.studentName.trim();
            const match = SORTED_STUDENTS.find(s => s.toUpperCase() === name.toUpperCase());
            const key = match || name;

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

                        // If there are duplicates, prioritise 'validated', then 'rejected', then 'pending'
                        // But simplest is to just overwrite. 
                        // Let's assume most recent log (sorted by date usually) is truth, 
                        // but actually we iterate all. 
                        // Let's use the status from the log.
                        newStatusMap[key][sessionKey] = currentStatus;
                    }
                }
            }
        });

        setStatusMap(newStatusMap);
    }, []);

    const calculateProgress = (studentName: string, code: string, count: number) => {
        // Count ONLY sessions that are VALIDATED
        const completed = new Array(count).fill(0).filter((_, i) =>
            statusMap[studentName]?.[`${code}-${i + 1}`] === 'validated'
        ).length;
        return Math.round((completed / count) * 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Progreso del Curso</h1>
            </div>

            <div className="flex gap-4 mb-4 text-xs font-medium text-zinc-600 dark:text-zinc-400 flex-wrap">
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-100 border border-green-200 rounded"></div> Validada</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-100 border border-orange-200 rounded"></div> Pendiente</div>
                <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-100 border border-purple-200 rounded"></div> Discrepancia</div>
            </div>

            <div className="grid gap-6">
                {SORTED_STUDENTS.map(student => (
                    <Card key={student} className="overflow-hidden">
                        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 p-4">
                            <CardTitle className="text-lg font-bold flex justify-between items-center">
                                {student}
                                <span className="text-xs font-normal text-zinc-500 bg-white dark:bg-zinc-800 px-2 py-1 rounded border">
                                    Estado del Curso
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
                                                const status = statusMap[student]?.[sessionKey]; // 'validated' | 'pending' | 'rejected' | undefined

                                                let bgClass = "bg-zinc-50 text-zinc-300 dark:bg-zinc-800/50 dark:text-zinc-600 border border-zinc-100 dark:border-zinc-800"; // Default (Empty)

                                                if (status === 'validated') {
                                                    bgClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800";
                                                } else if (status === 'rejected') {
                                                    bgClass = "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 border border-purple-200 dark:border-purple-800";
                                                } else if (status === 'pending') {
                                                    bgClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 border border-orange-200 dark:border-orange-800";
                                                }

                                                return (
                                                    <div
                                                        key={sessionNum}
                                                        className={cn(
                                                            "h-8 flex items-center justify-center rounded text-xs font-mono font-medium transition-all cursor-default",
                                                            bgClass
                                                        )}
                                                        title={`${module.code}-${sessionNum}: ${status ? status.toUpperCase() : 'No realizada'}`}
                                                    >
                                                        {sessionNum}
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
