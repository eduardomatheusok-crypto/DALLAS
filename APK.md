# Deploy do DALLAS — Render + Supabase + Vercel + APK

Guia de implantação do app com a stack escolhida:

| Camada | Onde roda |
|---|---|
| Backend (Spring Boot) | Render (Docker) |
| Banco de dados | Supabase (Postgres) |
| Frontend web (Expo) | Vercel |
| App Android (APK) | EAS Build (a instalar nos celulares) |

```
                        ┌─────────────── EAS Build ───────────────┐
                        │  EXPO_PUBLIC_API_URL=https://…   .apk  │
  celular (APK) ────────┤                                        ▼
        │                │                     ┌──────────────────────┐
        └───────────────►│                     │  Supabase (Postgres)  │
  navegador ─────────────┤  Vercel (web) ─────►│                       │
                        │         │            └──────────▲────────────┘
                        └───────► │                       │
                              Render (Spring Boot) ───────┘
```

A URL da API (`EXPO_PUBLIC_API_URL`) é **fixa em cada build**: o APK e o site
"queimam" a URL do Render no bundle. Ela é configurada no momento do build de
cada frente (Vercel e EAS). Em desenvolvimento (Metro), o app continua
descobrindo a API pelo host do dev server — nada muda.

---

## Passo 1 — Supabase (Postgres)

1. Criar um projeto em [supabase.com](https://supabase.com).
2. Em **Project Settings → Database → Connection string**, escolha **pooler**
   (porta `6543`) e pegue a string, por exemplo:
   ```
   postgresql://postgres.<ref>:<password>@aws-0-<região>.pooler.supabase.com:6543/postgres
   ```
3. Converta para JDBC e acrescente SSL:
   ```
   jdbc:postgresql://aws-0-<região>.pooler.supabase.com:6543/postgres?sslmode=require
   ```
   - `DB_URL` = esse valor JDBC
   - `DB_USERNAME` = `postgres.<ref>`
   - `DB_PASSWORD` = senha do banco
   - Manual: para aceitar SSL na conexão, o JDBC URL é o acima (`sslmode=require`).
4. O banco nasce limpo; as tabelas são criadas automaticamente pelo Hibernate
   (`ddl-auto=update`) na primeira subida.

> O `application.properties` do backend já lê `DB_URL`/`DB_USERNAME`/`DB_PASSWORD`
> (com fallback para o Postgres local), então nada de config do app muda.

---

## Passo 2 — Backend no Render

O repositório já contém `backend/Dockerfile` e `render.yaml` (blueprint).

1. Suba o repositório para o GitHub.
2. No [Render](https://render.com): **New → Blueprint**, selecione o repo → o
   `render.yaml` cria o serviço `dallas-api`.
3. Preencha as env vars secretas no serviço:
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (do passo 1)
   - `APP_TOKEN_SECRET` = string longa e aleatória (segredo dos tokens JWT)
   - `CORS_ALLOWED_ORIGINS` = `https://<seu-app>.vercel.app`
4. Confirmar que `/api/health` responde `{"status":"ok"}`.

A URL do serviço vira algo como `https://dallas-api-xxxx.onrender.com` — é essa
a URL usada no passo 4.

**Dockerfile (backend/):**
```dockerfile
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY target/fit-treino-api-0.0.1-SNAPSHOT.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

---

## Passo 3 — Frontend web na Vercel

O app é React Native; a versão web é gerada com `expo export --platform web`
(SPA estática). Já configurado no projeto:

- `package.json`: script `build:web`
- `vercel.json`: `buildCommand: "npm run build:web"`, `outputDirectory: "dist"`

No [Vercel](https://vercel.com):

1. **Add New Project** → importar o repositório (mesmo do Render ou um separado).
2. **Build Command** `npm run build:web` · **Output Directory** `dist`.
3. Em **Environment Variables**, adicionar:
   - `EXPO_PUBLIC_API_URL` = `https://dallas-api-xxxx.onrender.com`
4. Fazer o deploy da branch padrão.

O site fica em `https://<seu-app>.vercel.app`.

---

## Passo 4 — APK Android (EAS Build)

O `eas.json` já tem o perfil `preview` que gera arquivo **.apk**:

```json
"preview": {
  "distribution": "internal",
  "android": { "buildType": "apk" }
}
```

1. Preparar uma única vez:
   ```bash
   npx eas login            # conta Expo
   npx eas project:init     # vincula o diretório a um projeto EAS
   npx eas build:configure
   ```
2. Gerar o APK (a URL do backend é embutida no build):
   ```bash
   EXPO_PUBLIC_API_URL=https://dallas-api-xxxx.onrender.com \
     npx eas build -p android --profile preview
   ```
3. Na primeira build o EAS gera as credenciais de assinatura (fluxo interno).
4. Ao terminar, baixe o `.apk` pelo link/QR exibido e instale no celular
   (permitir "instalação de fontes desconhecidas" uma vez).

**O APK não usa Metro/dev server** — o aviso "Cannot connect to Expo CLI" não
existe em build de produção.

---

## Passo 5 — Testar

- **Web**: abrir `https://<seu-app>.vercel.app` num navegador (CORS já libera
  essa origem no Render).
- **Android**: instalar o APK e testar o fluxo completo contra a API na nuvem.
- Fluxo: login/cadastro → Comunidade → criar grupo → entrar com código →
  nova competição → registrar treino → ranking/chat → encerrar competição.

---

## Dev local continua funcionando

Sem `EXPO_PUBLIC_API_URL`, o app usa `getDevServer()` (Metro) e o backend local
no mesmo Wi-Fi. Vercel/EAS só afetam as builds de produção.

---

## Avisos

- **URL fixa no build**: trocar a URL do Render exige rebuildar o APK e
  redeployar o web com a nova env.
- **`APP_TOKEN_SECRET`**: se mudar, tokens antigos param de valer; logue
  novamente nos apps.
- **EAS free tier**: fila de build e limite mensal.
- **Credentials/assinatura**: se a conta Expo mudar, as credenciais podem exigir
  recuperação para continuar atualizando o APK com o mesmo pacote
  (`com.fittreino.dallas`).