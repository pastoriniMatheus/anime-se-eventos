import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { useSystemSettings } from '@/hooks/useSystemSettings';
import { Eye, EyeOff, GraduationCap } from 'lucide-react';
import { loadSupabaseConfig } from '@/utils/supabaseClientUpdater';
const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const {
    login
  } = useAuth();
  const navigate = useNavigate();
  const {
    data: systemSettings = [],
    isLoading: settingsLoading
  } = useSystemSettings();

  // Verificar conexão atual
  React.useEffect(() => {
    const config = loadSupabaseConfig();
    console.log('Configuração atual do banco:', config);
    console.log('Configurações do sistema carregadas:', systemSettings);
  }, [systemSettings]);

  // Buscar logo das configurações do sistema - fix the array check
  const logoSetting = Array.isArray(systemSettings) ? systemSettings.find((s: any) => s.key === 'visual_logo_url' || s.key === 'logo') : null;
  let logoUrl = '/lovable-uploads/c7eb5d40-5d53-4b46-b5a9-d35d5a784ac7.png'; // fallback

  if (logoSetting) {
    try {
      logoUrl = typeof logoSetting.value === 'string' ? logoSetting.value : JSON.parse(String(logoSetting.value));
    } catch (e) {
      console.error('Erro ao processar logo:', e);
    }
  }
  console.log('Logo URL final:', logoUrl);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const result = await login(username, password);
    if (result.success) {
      navigate('/dashboard');
    } else {
      setError(result.error || 'Erro no login');
    }
    setLoading(false);
  };
  return <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-yellow-50 flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
          <CardHeader className="text-center pb-1 pt-1 py-0">
            <div className="flex justify-center mb-0 px-[24px] py-[24px]">
              {settingsLoading ? <div className="w-36 h-32 bg-gray-200 animate-pulse rounded"></div> : <img src={logoUrl} alt="Logo" onError={e => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }} className="w-48 h-32 object-contain" />}
              <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-blue-700 rounded-full flex items-center justify-center shadow-lg hidden">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
            </div>
          </CardHeader>
          
          <CardContent className="px-8 pb-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Usuário ou Email
                </label>
                <Input id="username" type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Digite seu usuário ou email" className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20" required />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Digite sua senha" className="h-12 border-2 border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 pr-12" required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700">
                    {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
                  {error}
                </div>}

              <Button type="submit" disabled={loading} className="w-full h-12 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                {loading ? 'Entrando...' : 'Entrar'}
              </Button>
            </form>

            
          </CardContent>
        </Card>
      </div>
    </div>;
};
export default Login;