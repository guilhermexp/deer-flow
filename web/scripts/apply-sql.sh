#!/bin/bash

# Script para aplicar correções SQL no Supabase
# Certifique-se de ter as variáveis de ambiente configuradas

echo "🔧 Aplicando correções das tabelas de chat no Supabase..."

# Verificar se as variáveis de ambiente estão configuradas
if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Erro: Configure as variáveis de ambiente SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY"
    echo ""
    echo "Exemplo:"
    echo "export SUPABASE_URL='https://seu-projeto.supabase.co'"
    echo "export SUPABASE_SERVICE_ROLE_KEY='sua-service-role-key'"
    echo ""
    exit 1
fi

# Aplicar o script SQL
echo "📝 Executando script SQL..."

curl -X POST "$SUPABASE_URL/rest/v1/rpc/exec_sql" \
  -H "apikey: $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Authorization: Bearer $SUPABASE_SERVICE_ROLE_KEY" \
  -H "Content-Type: application/json" \
  -d @<(cat << 'EOF'
{
  "sql": "$(cat web/scripts/fix-chat-tables.sql | sed 's/"/\\"/g' | tr '\n' ' ')"
}
EOF
)

echo ""
echo "✅ Script aplicado! Teste o chat novamente."