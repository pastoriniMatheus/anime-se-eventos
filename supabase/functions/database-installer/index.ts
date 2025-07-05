
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

interface DatabaseConfig {
  type: 'supabase' | 'postgresql';
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceKey?: string;
  host?: string;
  port?: number;
  database?: string;
  username?: string;
  password?: string;
}

const checkExistingTables = async (supabaseClient: any) => {
  try {
    const { data, error } = await supabaseClient
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', [
        'authorized_users', 'courses', 'postgraduate_courses', 'lead_statuses',
        'events', 'qr_codes', 'scan_sessions', 'leads', 'message_history'
      ]);

    if (error) {
      console.log('Error checking tables:', error);
      return [];
    }

    return data?.map((row: any) => row.table_name) || [];
  } catch (error) {
    console.log('Exception checking tables:', error);
    return [];
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Database installer function called');
    
    // Parse request body
    let body;
    try {
      const text = await req.text();
      console.log('Raw request body:', text);
      body = JSON.parse(text);
    } catch (parseError) {
      console.log('Error parsing request body:', parseError);
      return new Response(
        JSON.stringify({ 
          success: false,
          error: 'Invalid JSON in request body',
          details: parseError.toString()
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200
        }
      );
    }

    const { action, config } = body;
    console.log('Parsed request:', { action, configType: config?.type });

    // Validate action
    if (!action) {
      throw new Error('Action is required');
    }

    if (action === 'test_connection') {
      console.log('Processing test_connection action');
      
      if (!config || !config.type) {
        throw new Error('Configuration is required');
      }

      if (config.type === 'supabase') {
        console.log('Testing Supabase connection');
        
        if (!config.supabaseUrl || !config.supabaseServiceKey) {
          throw new Error('Supabase URL and Service Key are required');
        }

        // Validate URL format
        if (!config.supabaseUrl.includes('supabase.co')) {
          throw new Error('Invalid Supabase URL format');
        }

        console.log('Creating Supabase client');
        const supabaseClient = createClient(
          config.supabaseUrl,
          config.supabaseServiceKey
        );

        console.log('Testing database connection');
        // Test connection with a simple query
        const { data: testData, error: testError } = await supabaseClient
          .from('information_schema.tables')
          .select('table_name')
          .limit(1);

        if (testError) {
          console.log('Supabase connection error:', testError);
          throw new Error(`Connection failed: ${testError.message}`);
        }

        console.log('Connection successful, checking existing tables');
        // Check for existing tables
        const existingTables = await checkExistingTables(supabaseClient);
        console.log('Found existing tables:', existingTables);

        return new Response(
          JSON.stringify({ 
            success: true, 
            existingTables,
            message: 'Supabase connection established successfully'
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        throw new Error('Only Supabase is supported in this version');
      }
    }

    if (action === 'install') {
      console.log('Processing install action');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'Installation functionality is under development'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error: any) {
    console.error('Error in database-installer function:', error);
    
    const errorMessage = error.message || 'Internal server error';
    const errorDetails = error.toString();
    
    console.log('Returning error response:', { errorMessage, errorDetails });
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: errorMessage,
        details: errorDetails
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  }
})
