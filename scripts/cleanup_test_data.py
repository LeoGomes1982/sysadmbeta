"""
Script para deletar históricos de teste e resetar pontos dos funcionários
Leandro Da Silva Gomes E Silva e Arthur Pizzani Silva
"""

import os
from supabase import create_client, Client

# Conectar ao Supabase usando as variáveis de ambiente
supabase_url = os.environ.get('SUPABASE_URL')
supabase_key = os.environ.get('SUPABASE_SERVICE_ROLE_KEY')

if not supabase_url or not supabase_key:
    print("❌ Erro: Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontradas")
    exit(1)

supabase: Client = create_client(supabase_url, supabase_key)

print("🔄 Conectando ao Supabase...")

# Buscar IDs dos funcionários
print("\n📋 Buscando funcionários...")
response = supabase.table('employees').select('id, nome_completo, pontuacao').or_(
    'nome_completo.ilike.%Leandro%Silva%Gomes%,nome_completo.ilike.%Arthur%Pizzani%'
).execute()

if not response.data:
    print("❌ Nenhum funcionário encontrado com esses nomes")
    exit(1)

print(f"✅ Encontrados {len(response.data)} funcionários:")
for emp in response.data:
    print(f"   - {emp['nome_completo']} (ID: {emp['id']}, Pontos: {emp.get('pontuacao', 0)})")

employee_ids = [emp['id'] for emp in response.data]

# Deletar históricos
print("\n🗑️  Deletando históricos de teste...")
try:
    delete_response = supabase.table('employee_history').delete().in_('employee_id', employee_ids).execute()
    print(f"✅ Históricos deletados com sucesso")
except Exception as e:
    print(f"⚠️  Aviso ao deletar históricos: {e}")

# Resetar pontos para 10
print("\n🔄 Resetando pontos para 10...")
for emp_id in employee_ids:
    try:
        update_response = supabase.table('employees').update({
            'pontuacao': 10
        }).eq('id', emp_id).execute()
        print(f"✅ Pontos resetados para funcionário ID {emp_id}")
    except Exception as e:
        print(f"❌ Erro ao resetar pontos do funcionário ID {emp_id}: {e}")

# Verificar resultado final
print("\n📊 Verificando resultado final...")
final_response = supabase.table('employees').select('nome_completo, pontuacao').in_('id', employee_ids).execute()

print("\n✅ Resultado final:")
for emp in final_response.data:
    print(f"   - {emp['nome_completo']}: {emp.get('pontuacao', 0)} pontos")

print("\n✨ Script executado com sucesso!")
