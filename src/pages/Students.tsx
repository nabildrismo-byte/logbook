import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/Card'
import { storageService } from '@/services/storage'
import { authService } from '@/services/auth'
import { FlightLog } from '@/types'
import { STUDENTS } from '@/lib/constants'
import { Users, ChevronRight, GraduationCap } from 'lucide-react'
import { format } from 'date-fns'

interface StudentSummary {
    name: string;
    totalTime: number;
    flightCount: number;
    averageGrade: number;
    lastFlight: string;
}

export function Students() {
    const navigate = useNavigate();
    const [students, setStudents] = useState<StudentSummary[]>([]);
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user) {
            navigate('/login');
            return;
        }
        loadData();
    }, [user, navigate]);

    const loadData = () => {
        const logs = storageService.getLogs();

        // Map Canonical Name -> Logs
        const studentMap = new Map<string, FlightLog[]>();

        const removeAccents = (str: string) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

        // Initialize map with all students from constants to ensure they appear even with 0 flights
        const canonicalNames = STUDENTS;
        canonicalNames.forEach(name => {
            studentMap.set(name, []);
        });

        logs.forEach(log => {
            if (!log.studentName) return;

            // Normalize both log name and canonical names by stripping accents entirely
            let logNameClean = removeAccents(log.studentName.trim());

            // Try to find a matching canonical name
            let matchedName = log.studentName; // Default to original if no match (or mapped one)

            // Update match logic to handle the clean version
            const foundCanonical = canonicalNames.find(c => {
                const cClean = removeAccents(c);
                return cClean === logNameClean;
            });

            if (foundCanonical) {
                matchedName = foundCanonical;
            }

            if (!studentMap.has(matchedName)) {
                studentMap.set(matchedName, []);
            }
            studentMap.get(matchedName)?.push(log);
        });

        // Calculate stats
        const summaries: StudentSummary[] = [];
        studentMap.forEach((studentLogs, name) => {
            const totalTime = studentLogs.reduce((sum, log) => sum + (log.totalTime || 0), 0);

            // Handle string grades
            const numericGrades = studentLogs
                .map(l => parseFloat(l.grade))
                .filter(n => !isNaN(n));

            const avgGrade = numericGrades.length > 0
                ? numericGrades.reduce((sum, val) => sum + val, 0) / numericGrades.length
                : 0;

            // Sort by date for last flight
            studentLogs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            const lastLog = studentLogs.length > 0 ? studentLogs[0] : null;

            summaries.push({
                name,
                totalTime,
                flightCount: studentLogs.length,
                averageGrade: avgGrade,
                // If no flights, use empty string or handled in UI
                lastFlight: lastLog ? lastLog.date : ''
            });
        });

        // Sort alphabetically
        summaries.sort((a, b) => a.name.localeCompare(b.name));
        setStudents(summaries);
    };

    const formatDuration = (minutes: number) => {
        return (minutes / 60).toFixed(1).replace('.', ',');
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    Alumnos
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400">Listado de alumnos en formación.</p>
            </div>

            <div className="space-y-3">
                {students.length === 0 ? (
                    <div className="text-center py-10 text-zinc-500">
                        <GraduationCap className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        No hay alumnos registrados.
                    </div>
                ) : (
                    students.map((student) => (
                        <Link key={student.name} to={`/students/${encodeURIComponent(student.name)}`}>
                            <Card className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg">{student.name}</h3>
                                        <div className="text-sm text-zinc-500 flex gap-4 mt-1">
                                            <span>{student.flightCount} sesione(s)</span>
                                            <span>{formatDuration(student.totalTime)} hrs</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${student.averageGrade < 5 ? 'text-red-600' : 'text-green-600'}`}>
                                                {student.averageGrade.toFixed(1)}
                                            </div>
                                            <div className="text-[10px] text-zinc-400">
                                                Último: {student.lastFlight ? format(new Date(student.lastFlight), 'dd/MM/yy') : '-'}
                                            </div>
                                        </div>
                                        <ChevronRight className="h-5 w-5 text-zinc-300" />
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))
                )}
            </div>
        </div>
    )
}
