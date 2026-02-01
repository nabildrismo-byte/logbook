import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { PlusCircle, LayoutDashboard, LogOut, Users, BarChart3, GraduationCap, Medal, ShieldCheck, Plane } from 'lucide-react'
import { cn } from '@/lib/utils'
import { authService } from '@/services/auth'
import { useEffect } from 'react'

export function Layout() {
    const location = useLocation();
    const navigate = useNavigate();
    const user = authService.getCurrentUser();

    useEffect(() => {
        if (!user) {
            navigate('/login');
        }
    }, [user, navigate]);

    if (!user) return null;

    const navItems = [
        { to: '/', icon: LayoutDashboard, label: 'Logs' },
        ...(user.role !== 'student' ? [
            { to: '/my-flights', icon: Plane, label: 'Mis Vuelos' },
            { to: '/meter', icon: BarChart3, label: 'Vuelímetro' },
            ...(user.role === 'admin' ? [
                { to: '/instructors', icon: Medal, label: 'Instructores' },
                { to: '/validations', icon: ShieldCheck, label: 'Validaciones' }
            ] : []),
            { to: '/students', icon: Users, label: 'Alumnos' },
            // Removed 'Nuevo' from here to place manually
        ] : []),
        ...(user.role === 'student' ? [
            { to: '/tracker', icon: GraduationCap, label: 'Progreso' },
        ] : [
            { to: '/tracker', icon: GraduationCap, label: 'Progreso' },
        ]),
    ];

    const handleLogout = () => {
        authService.logout();
        navigate('/login');
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col">
            <header className="sticky top-0 z-50 w-full border-b border-zinc-200 bg-white/80 backdrop-blur-xl dark:border-zinc-800 dark:bg-zinc-950/80">
                <div className="container flex h-14 max-w-screen-xl mx-auto items-center justify-between px-4">
                    <div className="flex items-center gap-6">
                        <Link to="/" className="flex items-center space-x-2">
                            <Plane className="h-6 w-6 rotate-[-90deg] text-blue-600" />
                            <span className="font-bold hidden sm:inline-block">HeliLog</span>
                        </Link>

                        {/* DESKTOP NAV */}
                        <nav className="hidden md:flex items-center gap-2 lg:gap-4">
                            {/* Prominent NEW button at the start */}
                            {user.role !== 'student' && (
                                <Link
                                    to="/add"
                                    className="flex items-center gap-1.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-full transition-colors shadow-sm mr-2"
                                >
                                    <PlusCircle className="h-4 w-4" />
                                    NUEVO
                                </Link>
                            )}

                            {navItems.map(({ to, label, icon: Icon }) => {
                                const isActive = location.pathname === to || (to === '/students' && location.pathname.startsWith('/students'));
                                return (
                                    <Link
                                        key={to}
                                        to={to}
                                        className={cn(
                                            "flex items-center gap-1.5 text-sm font-medium transition-colors hover:text-blue-600 px-2 py-1 rounded-md hover:bg-zinc-100 dark:hover:bg-zinc-800",
                                            isActive ? "text-blue-600 bg-blue-50 dark:bg-blue-900/10" : "text-zinc-500"
                                        )}
                                    >
                                        <Icon className="h-4 w-4" />
                                        {label}
                                    </Link>
                                )
                            })}
                        </nav>
                    </div>

                    <div className="flex items-center gap-2">
                        <span className="text-sm font-medium hidden sm:inline-block text-zinc-600 dark:text-zinc-400">
                            {user.name} ({user.role === 'admin' ? 'Jefe' : user.role === 'student' ? 'Alumno' : 'Inst.'})
                        </span>
                        <button onClick={handleLogout} className="p-2 hover:bg-zinc-100 rounded-full dark:hover:bg-zinc-800" title="Cerrar Sesión">
                            <LogOut className="h-5 w-5 text-zinc-500" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1 container max-w-screen-md mx-auto p-4 pb-24">
                <Outlet />
            </main>

            {/* MOBILE NAV */}
            <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-zinc-200 bg-white/90 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/90 md:hidden pb-safe">
                <div className="flex h-16 items-center justify-around">
                    {navItems.map(({ to, icon: Icon, label }) => {
                        const isActive = location.pathname === to || (to === '/students' && location.pathname.startsWith('/students'));
                        return (
                            <Link
                                key={to}
                                to={to}
                                className={cn(
                                    "flex flex-col items-center justify-center space-y-1 w-full h-full",
                                    isActive
                                        ? "text-blue-600 dark:text-blue-500"
                                        : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100"
                                )}
                            >
                                <Icon className="h-6 w-6" />
                                <span className="text-[10px] font-medium">{label}</span>
                            </Link>
                        )
                    })}
                </div>
            </nav>
        </div>
    )
}
