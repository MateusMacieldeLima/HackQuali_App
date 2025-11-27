# ✅ SOLUÇÃO: Erro "Email not confirmed"

## 🎯 O Problema

```
❌ Erro ao fazer login: "Email not confirmed" (Status 400)
```

Isso ocorre quando o Supabase exige confirmação de email antes de permitir login.

---

## 🚀 Solução Rápida (Recomendada para Desenvolvimento)

### Desabilitar Email Confirmation no Supabase

1. Acesse: https://app.supabase.com
2. Clique no projeto **HackQuali**
3. Vá para **Authentication** → **Providers**
4. Procure por **Email**
5. Clique em **Email** para expandir as opções
6. **Desabilite** a opção: "Require email confirmation"
7. Clique em **Save**
8. Reinicie o app: `npx expo start --clear`

✅ **Agora você poderá fazer login sem confirmar email!**

---

## 🔧 Alterações Implementadas no Código

### 1. AuthContext melhorado
- Tenta auto-confirmar email se receber erro "Email not confirmed"
- Envia email de confirmação automaticamente
- Melhor tratamento de erros com mensagens claras

### 2. Página de teste (`/auth-test`)
Acesse toque 5 vezes no título "HackQuali" na login para acessar:
- 🔐 **Testar Login** - Testa autenticação
- 📝 **Testar Sign-up** - Cria nova conta
- 📧 **Reenviar Email** - Reenvia confirmação
- ⚙️ **Ver Config** - Mostra configuração do Supabase

### 3. Fluxo de Confirmação
Se email confirmation estiver ativado:
1. Crie uma conta normalmente
2. Clique em "📧 Reenviar Email" na página de teste
3. Confira seu email e clique no link
4. Tente fazer login novamente

---

## 📚 Teste Rápido

**Email de teste:** `test@example.com`  
**Senha de teste:** `test123456`

1. Acesse a página de teste (5 taps no título)
2. Clique em "📝 Testar Sign-up"
3. Clique em "🔐 Testar Login"
4. Se der "Email not confirmed", clique em "📧 Reenviar Email"

---

## 📋 Próximos Passos

- [ ] Desabilitar email confirmation no Supabase
- [ ] Reiniciar app com `npx expo start --clear`
- [ ] Criar conta de teste
- [ ] Fazer login com a conta criada
- [ ] Verificar se redirecionamento funciona

---

## ⚙️ Configuração para Produção

Para produção, você deve:
1. ✅ Manter email confirmation **ativado**
2. ✅ Implementar página de confirmação de email
3. ✅ Usar webhooks ou triggers para auto-confirmar em casos específicos
4. ✅ Enviar emails de boas-vindas após confirmação

---

## 🆘 Ainda com Problemas?

Se ainda não conseguir fazer login:

1. Verifique a chave de API em `.env.local`:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://djnzhlvkaatcsavgshzk.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

2. Verifique o console do browser (F12) para mais detalhes

3. Use a página de teste (`/auth-test`) para diagnosticar

4. Confira o painel do Supabase se há erros ou logs
