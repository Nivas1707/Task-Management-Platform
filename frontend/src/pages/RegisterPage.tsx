import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { motion } from 'framer-motion';
import { Mail, Lock, User, AlertCircle } from 'lucide-react';

export const RegisterPage = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await api.post('/auth/register', { name, email, password });
            login(response.data.token, response.data.user);
            navigate('/dashboard');
        } catch (err: any) {
            // Handle array of errors from Zod if present, or simple message
            if (err.response?.data?.errors) {
                setError(err.response.data.errors.map((e: any) => e.message).join(', '));
            } else {
                setError(err.response?.data?.message || 'Registration failed');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Gradients */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[100px]" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 rounded-full blur-[100px]" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-400 to-indigo-400">
                        Join the Future
                    </h1>
                    <p className="text-gray-400 mt-2">Start organizing your life today</p>
                </div>

                <Card hoverEffect={false}>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg flex items-center gap-2 text-sm"
                            >
                                <AlertCircle size={16} />
                                {error}
                            </motion.div>
                        )}

                        <Input
                            label="Full Name"
                            type="text"
                            placeholder="John Doe"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            icon={<User size={18} />}
                        />

                        <Input
                            label="Email"
                            type="email"
                            placeholder="name@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            icon={<Mail size={18} />}
                            required
                        />

                        <Input
                            label="Password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            icon={<Lock size={18} />}
                            required
                        />

                        <Button type="submit" className="w-full" isLoading={isLoading}>
                            Create Account
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        Already have an account?{' '}
                        <Link to="/login" className="text-indigo-400 hover:text-indigo-300 transition-colors">
                            Sign in
                        </Link>
                    </div>
                </Card>
            </motion.div>
        </div>
    );
};
