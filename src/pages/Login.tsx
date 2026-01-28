import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '@/services/auth';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/Card';
import { Plane } from 'lucide-react';

export function Login() {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        const user = authService.login(username, password);
        if (user) {
            navigate('/');
        } else {
            setError('Usuario o contraseña incorrectos');
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex items-center justify-center p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center pb-2">
                    <div className="mx-auto bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full w-fit mb-2">
                        <Plane className="h-8 w-8 text-blue-600 dark:text-blue-400 rotate-[-90deg]" />
                    </div>
                    <CardTitle className="text-xl">HeliLog IFR</CardTitle>
                    <p className="text-sm text-zinc-500">Acceso Restringido</p>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                        <Input
                            placeholder="Usuario (ej. DRIS)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            autoCapitalize="none"
                        />
                        <Input
                            type="password"
                            placeholder="Contraseña"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {error && <p className="text-sm text-red-500 font-medium text-center">{error}</p>}

                        <Button type="submit" className="w-full" size="lg">
                            Entrar
                        </Button>

                        <div className="text-xs text-center text-zinc-400 mt-4">
                            <p>Demo accounts:</p>
                            <p>dris / 123</p>
                            <p>admin / admin</p>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
