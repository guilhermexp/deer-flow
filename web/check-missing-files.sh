#!/bin/bash

echo "🔍 Verificando arquivos faltando..."
echo ""

SOURCE="/Users/guilhermevarela/deer-flow/web/src"
DEST="/Users/guilhermevarela/Public/FlowDeep/deer-flow/web/src"

# Lista de diretórios para verificar
DIRS=(
  "hooks"
  "lib"
  "components/ui"
  "data"
)

for dir in "${DIRS[@]}"; do
  echo "📁 Verificando $dir..."
  
  if [ -d "$SOURCE/$dir" ]; then
    # Listar arquivos no diretório de origem
    for file in "$SOURCE/$dir"/*; do
      if [ -f "$file" ]; then
        filename=$(basename "$file")
        
        # Verificar se o arquivo existe no destino
        if [ ! -f "$DEST/$dir/$filename" ]; then
          echo "  ❌ Faltando: $dir/$filename"
          # Criar diretório se não existir
          mkdir -p "$DEST/$dir"
          # Copiar arquivo
          cp "$file" "$DEST/$dir/"
          echo "  ✅ Copiado: $dir/$filename"
        fi
      fi
    done
  fi
done

echo ""
echo "✅ Verificação concluída!"