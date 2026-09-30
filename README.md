# Cubity Receivables

App for Cubity Engineering & Construction to track client dues, partial payments, and promised pay dates.

**Product docs (features, screens, changelog): [docs/APP.md](docs/APP.md)**

## Run

```bash
brew services start postgresql@17
createdb cubity_dev
cp .env.example .env   # set your macOS user in both URLs
npm install
npm run db:migrate
npm run db:seed   # optional fake data
npm run dev
```

Then open the URL Next.js prints (usually http://localhost:3000).
