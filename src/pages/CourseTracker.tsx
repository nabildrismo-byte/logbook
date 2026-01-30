import { useEffect, useState } from 'react'
import { storageService } from '@/services/storage'
import { STUDENTS, ORDERED_STUDENT_NAMES } from '@/lib/constants'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { GraduationCap } from 'lucide-react'
import { cn } from '@/lib/utils'

export function CourseTracker() {
    const [status, setStatus] = useState<Record<string, Set<string>>>({});

    // Define Course Requirements
    const MODULES = [
        { code: 'VBAS', count: 12, label: 'Básico (VBAS)' },
        { code: 'VRAD', count: 20, label: 'Radio (VRAD)' },
        { code: 'VPRA', count: 16, label: 'Práctico (VPRA)' },
    ];

    // Merge with any other students in constants that might be missing from the specific list
    const SORTED_STUDENTS = [
        ...ORDERED_STUDENT_NAMES,
        ...STUDENTS.filter(s => !ORDERED_STUDENT_NAMES.includes(s))
    ];

    useEffect(() => {
        const logs = storageService.getLogs();
        const studentProgress: Record<string, Set<string>> = {};

        // Init
        // Use the Sorted List for initialization to ensure keys exist
        SORTED_STUDENTS.forEach(s => studentProgress[s] = new Set());

        logs.forEach(log => {
            let name = log.studentName.trim();
            const match = SORTED_STUDENTS.find(s => s.toUpperCase() === name.toUpperCase());
            const key = match || name;

            if (!studentProgress[key]) studentProgress[key] = new Set();

            // Normalize session format (e.g., "VBAS-1", "VBAS-01" -> "VBAS-1")
            // Assuming log.session is "TYPE-NUMBER"
            if (log.session) {
                const parts = log.session.split('-');
                if (parts.length >= 2) {
                    const type = parts[0].toUpperCase();
                    const num = parseInt(parts[1], 10);
                    if (!isNaN(num)) {
                        studentProgress[key].add(`${type}-${num}`);
                    }
                }
            }
        });

        setStatus(studentProgress);
    }, []);

    const calculateProgress = (studentName: string, code: string, count: number) => {
        const completed = new Array(count).fill(0).filter((_, i) =>
            status[studentName]?.has(`${code}-${i + 1}`)
        ).length;
        return Math.round((completed / count) * 100);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-2 mb-6">
                <GraduationCap className="h-6 w-6 text-blue-600" />
                <h1 className="text-2xl font-bold">Progreso del Curso</h1>
            </div>

            <div className="grid gap-6">
                {SORTED_STUDENTS.map(student => (
                    <Card key={student} className="overflow-hidden">
                        <CardHeader className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 p-4">
                            <CardTitle className="text-lg font-bold flex justify-between items-center">
                                {student}
                                <span className="text-xs font-normal text-zinc-500 bg-white dark:bg-zinc-800 px-2 py-1 rounded border">
                                    {/* Overall Progress could go here */}
                                    Estado del Curso
                                </span>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-6">
                            {MODULES.map(module => {
                                const progress = calculateProgress(student, module.code, module.count);
                                const isComplete = progress === 100;

                                return (
                                    <div key={module.code} className="space-y-3">
                                        <div className="flex justify-between items-end">
                                            <h3 className="text-sm font-bold flex items-center gap-2">
                                                <span className={cn(
                                                    "w-2 h-2 rounded-full",
                                                    isComplete ? "bg-green-500" : "bg-blue-500"
                                                )} />
                                                {module.label}
                                            </h3>
                                            <span className="text-xs text-zinc-400 font-mono">
                                                {progress}% Completado
                                            </span>
                                        </div>

                                        {/* Grid of Sessions */}
                                        <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5">
                                            {Array.from({ length: module.count }).map((_, i) => {
                                                const sessionNum = i + 1;
                                                const isDone = status[student]?.has(`${module.code}-${sessionNum}`);
                                                return (
                                                    <div
                                                        key={sessionNum}
                                                        className={cn(
                                                            "h-8 flex items-center justify-center rounded text-xs font-mono font-medium transition-all",
                                                            isDone
                                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800"
                                                                : "bg-zinc-50 text-zinc-300 dark:bg-zinc-800/50 dark:text-zinc-600 border border-zinc-100 dark:border-zinc-800"
                                                        )}
                                                        title={`${module.code}-${sessionNum}: ${isDone ? 'Completada' : 'Pendiente'}`}
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
