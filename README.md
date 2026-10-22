# Excel Editor

- `frontend/`: Angular-App mit Quellcode, Konfiguration und Tests.
- `backend/`: leerer Ordner für ein zukünftiges Backend.

## Frontend starten

```sh
cd frontend
npm install
npm start
```

Die App läuft unter http://localhost:4200.

## Build und Tests

Alle Befehle im Ordner `frontend/` ausführen:

```sh
npm run build
npm test -- --watch=false
npx playwright install chromium
npm run test:e2e
```

E2E-Tests werden mit Playwright ausgeführt, nicht mit Vitest.
Arbeitsmappen werden weiterhin im Browser gespeichert.

Git versioniert keine leeren Ordner. `backend/` bleibt lokal leer und erscheint
auf GitHub erst, wenn dort eine Datei hinzugefügt wird.
