import { User } from '@/types';
import { GOOGLE_SCRIPT_URL } from '@/lib/constants';


const USERS_KEY = 'heli_users_v1';
const CURRENT_USER_KEY = 'heli_current_user_v1';

// Seed initial users if empty or force update for v2 security
const seedUsers = () => {
    // Passwords: 5 chars, letters + numbers
    const users: User[] = [
        { id: 'admin', username: 'admin', name: 'Jefe de Curso', role: 'admin', password: '12curso' },
        { id: 'izquierdo', username: 'izquierdo', name: 'IZQUIERDO', role: 'instructor', password: 'zkq85' },
        { id: 'dris', username: 'dris', name: 'DRIS', role: 'instructor', password: 'dr73s' },
        { id: 'rodriguez', username: 'rodriguez', name: 'RODRIGUEZ', role: 'instructor', password: 'rdz92' },
        { id: 'prieto', username: 'prieto', name: 'PRIETO', role: 'instructor', password: 'pr12t' },
        { id: 'benjumea', username: 'benjumea', name: 'BENJUMEA', role: 'instructor', password: 'bnj47' },
        { id: 'soriano', username: 'soriano', name: 'SORIANO', role: 'instructor', password: 'srn63' },
        { id: 'duenas', username: 'dueñas', name: 'DUEÑAS', role: 'instructor', password: 'dn58s' },
    ];
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const authService = {
    init: () => {
        seedUsers();
    },

    login: (username: string, password: string): User | null => {
        authService.init();
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');

        // Case insensitive match for both username and password
        const user = users.find((u: User) =>
            u.username.toLowerCase() === username.trim().toLowerCase() &&
            (u.password || '').toLowerCase() === password.trim().toLowerCase()
        );

        if (user) {
            const { password, ...safeUser } = user;
            localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(safeUser));

            // Track Login
            const history = JSON.parse(localStorage.getItem('heli_login_history_v1') || '[]');
            history.unshift({
                name: user.name,
                username: user.username,
                timestamp: new Date().toISOString()
            });
            // Keep only last 100 logins
            if (history.length > 100) history.pop();
            localStorage.setItem('heli_login_history_v1', JSON.stringify(history));

            // Sync Login to Cloud (Fire & Forget)
            authService.syncLoginToCloud(safeUser);

            return safeUser;
        }
        return null;
    },

    logout: () => {
        localStorage.removeItem(CURRENT_USER_KEY);
    },

    getCurrentUser: (): User | null => {
        const data = localStorage.getItem(CURRENT_USER_KEY);
        return data ? JSON.parse(data) : null;
    },

    // Admin only
    createUser: (user: User) => {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || '[]');
        users.push(user);
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
    },

    getLoginHistory: () => {
        return JSON.parse(localStorage.getItem('heli_login_history_v1') || '[]');
    },

    syncLoginToCloud: async (user: User) => {
        // Fire and forget - don't block UI
        try {
            const formData = new FormData();
            formData.append('action', 'login');
            formData.append('username', user.username);
            formData.append('name', user.name);
            formData.append('role', user.role);
            formData.append('timestamp', new Date().toISOString());

            await fetch(GOOGLE_SCRIPT_URL, {
                method: 'POST',
                body: formData,
                mode: 'no-cors'
            });
        } catch (e) {
            console.error("Failed to sync login to cloud", e);
        }
    },

    getGlobalLoginHistory: async () => {
        try {
            // Fetch from Google Script with ?table=logins
            // Note: Google Script URL is a POST endpoint usually, ensuring it supports GET for doGet
            const response = await fetch(`${GOOGLE_SCRIPT_URL}?table=logins`);
            const data = await response.json();

            // Transform data if needed for UI (Sheet headers: FECHA, HORA, USUARIO, NOMBRE, ROL)
            // We want to map it to { name, timestamp } mostly.
            // But let's verify what the Script returns. It maps headers to object keys.
            // So we'll get objects like { "FECHA": "...", "HORA": "...", "NOMBRE": "..." }

            return data.map((row: any) => ({
                name: row['NOMBRE'] || row['USUARIO'] || 'Desconocido',
                // Construct timestamp or just use date/time strings for display
                dateStr: row['FECHA'],
                timeStr: row['HORA'],
                // Original robust timestamp might not be reconstructible perfectly due to timezone formatting in script,
                // but we can trust the display strings.
                raw: row
            })).reverse(); // Newest first (Sheet appends to bottom)
        } catch (error) {
            console.error("Error fetching global history:", error);
            // Fallback to local? Or return empty array
            return [];
        }
    }
};
