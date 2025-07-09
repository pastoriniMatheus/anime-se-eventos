
-- Verificar a constraint atual
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'message_history'::regclass 
AND contype = 'c';

-- Remover a constraint atual se existir
ALTER TABLE message_history DROP CONSTRAINT IF EXISTS message_history_filter_type_check;

-- Criar nova constraint que permite NULL e os valores corretos
ALTER TABLE message_history ADD CONSTRAINT message_history_filter_type_check 
CHECK (filter_type IS NULL OR filter_type IN ('course', 'event', 'status'));
