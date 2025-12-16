# Diagnostica Pagina Bianca - GitHub Pages

## Correzioni Applicate

### 1. **vite.config.ts** ✅

- Aggiunto `base: "/KnowYourCapital/"` per coerenza con vite.config.js
- Assicura che tutti gli asset siano caricati dal percorso corretto su GitHub Pages

### 2. **index.tsx** ✅

- Aggiunto **error handler globale** per catturare errori runtime non gestiti
- Aggiunto **try-catch** intorno a `ReactDOM.createRoot()`
- Gli errori saranno visibili in console e nella UI

### 3. **App.tsx** ✅

- Aggiunto **Error Boundary** per catturare errori durante il rendering
- Fallback UI che mostra l'errore se il componente App crasha
- Export wrappato con Error Boundary

### 4. **.env.production** ✅

- File template per variabili d'ambiente di produzione
- La GEMINI_API_KEY non è attualmente usata nell'app

## Come Testare

### Locale (development)

```bash
npm run dev
# Verifica che funzioni su http://localhost:3000
```

### Locale (production build)

```bash
npm run build
npm run preview
# Verifica su http://localhost:4173/KnowYourCapital/
# Apri DevTools → Console per vedere eventuali errori
```

### Su GitHub Pages

```bash
npm run deploy
# Accedi a https://stevit.github.io/KnowYourCapital/
# Se vedi ancora la pagina bianca, apri DevTools → Console
```

## Come Interpretare gli Errori

Se ora la pagina bianca mostra un messaggio di errore:

1. **Import mancanti**: `Cannot find module...` → Verificare percorsi import
2. **Runtime error**: `TypeError`, `ReferenceError` → Errore nel codice
3. **Asset non caricati**: Network tab in DevTools → Verificare base path
4. **CSS non caricato**: Pagina senza styling → Verificare base path in vite.config

## Prossimi Step

Se gli errori vengono risolti ma la pagina rimane bianca:

1. Verificare in Network tab che `index.html` e `main.js` si carichino
2. Controllare che non ci siano CORS issues
3. Verificare che `root` element esista in index.html

## Note sulla GEMINI_API_KEY

Al momento non è usata nell'app. Se in futuro vuoi aggiungere AI features:

1. Crea `.env.local` in development con `GEMINI_API_KEY=xxx`
2. Crea `.env.production` su GitHub Secrets o durante la build
3. Accedi a `process.env.GEMINI_API_KEY` nel codice React
