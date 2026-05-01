# VerzaPlants Starter

Sistema base para vender catálogos con stock a viveros/gardens.

## Estructura
- `frontend/`: Angular standalone app files para reemplazar/usar en tu proyecto.
- `backend/`: API Node.js + Express + MySQL.
- `database/schema.sql`: base de datos inicial.

## Backend
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

## Frontend
Crea un proyecto Angular normal:
```bash
ng new verzaplants --standalone --routing=false --style=css
cd verzaplants
```
Luego copia el contenido de `frontend/src/app` dentro de tu `src/app`.

En `src/main.ts` usa el `main.ts` incluido.

Corre:
```bash
ng serve
```
