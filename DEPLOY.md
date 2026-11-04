# Deploy Adegan ke Vercel

Sumber deploy: branch **`main`** saja. Jangan pakai `gh-pages`.

## 1. Satu kali setup di Vercel Dashboard

1. Project → **Settings → Git**
2. **Production Branch** = `main`
3. Save, lalu **Redeploy** sekali dari dashboard.

## 2. Secrets untuk deploy otomatis (GitHub Actions)

Di repo GitHub → **Settings → Secrets and variables → Actions**, tambah:

| Secret | Cara dapat |
|--------|------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) → Create |
| `VERCEL_ORG_ID` | Project → Settings → General → **Team ID** / dari `.vercel/project.json` setelah `vercel link` |
| `VERCEL_PROJECT_ID` | Sama, field **Project ID** |

Cara cepat ambil Org + Project ID:

```bash
npx vercel@latest link
cat .vercel/project.json
```

Setelah 3 secret terisi, **setiap push ke `main`** otomatis deploy production.

## 3. Deploy manual dari laptop

```bash
# Login sekali
npx vercel@latest login

# Link project (sekali)
npx vercel@latest link

# Production
npm run deploy
# atau
bash scripts/deploy-vercel.sh

# Preview saja
npm run deploy:preview
```

Atau dengan token (CI / non-interactive):

```bash
export VERCEL_TOKEN=xxx
export VERCEL_ORG_ID=xxx
export VERCEL_PROJECT_ID=xxx
bash scripts/deploy-vercel.sh
```

## 4. URL

https://blaze-frost-solar-ruby.vercel.app
