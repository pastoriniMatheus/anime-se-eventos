
export const generateShortUrl = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Função para obter a URL do Supabase dinamicamente das configurações do sistema
const getDynamicSupabaseUrl = (): string => {
  // Primeiro, tentar obter a URL do cliente Supabase atual
  if (typeof window !== 'undefined') {
    // Verificar se existe configuração customizada no localStorage
    const savedConfig = localStorage.getItem('supabase-config');
    if (savedConfig) {
      try {
        const config = JSON.parse(savedConfig);
        if (config.url) {
          return config.url;
        }
      } catch (error) {
        console.warn('Erro ao carregar configuração do Supabase do localStorage:', error);
      }
    }
  }
  
  // Fallback para a URL padrão atual do projeto
  return "https://iznfrkdsmbtynmifqcdd.supabase.co";
};

export const getShortUrlRedirect = (shortUrl: string) => {
  const supabaseUrl = getDynamicSupabaseUrl();
  return `${supabaseUrl}/functions/v1/qr-redirect/${shortUrl}`;
};

export const buildWhatsAppUrl = (whatsappNumber: string, eventName: string, trackingId?: string): string => {
  let message = eventName;
  
  if (trackingId) {
    message += ` id:${trackingId}`;
  }
  
  return `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
};

// Função para obter o domínio atual dinamicamente
export const getCurrentDomain = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  // Para SSR ou contextos sem window, usar uma URL padrão ou vazia
  return '';
};

// Função para construir URL de redirecionamento para QR codes WhatsApp - DINAMICA
export const buildQRRedirectUrl = (shortUrl: string): string => {
  const supabaseUrl = getDynamicSupabaseUrl();
  return `${supabaseUrl}/functions/v1/qr-redirect/${shortUrl}`;
};

// Função para construir URL do formulário com domínio atual
export const buildFormUrl = (eventName: string, trackingId: string): string => {
  const currentDomain = getCurrentDomain();
  
  // Se não conseguir obter o domínio atual (SSR), usar window.location se disponível
  if (!currentDomain && typeof window !== 'undefined') {
    const protocol = window.location.protocol;
    const host = window.location.host;
    return `${protocol}//${host}/form?event=${encodeURIComponent(eventName)}&tracking=${trackingId}`;
  }
  
  // Se temos o domínio atual, usar ele
  if (currentDomain) {
    return `${currentDomain}/form?event=${encodeURIComponent(eventName)}&tracking=${trackingId}`;
  }
  
  // Fallback para URL estática apenas se realmente necessário
  return `https://16392f28-253d-4401-9269-5672f0e9ac6a.lovableproject.com/form?event=${encodeURIComponent(eventName)}&tracking=${trackingId}`;
};
