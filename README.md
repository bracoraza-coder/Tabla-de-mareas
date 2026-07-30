# Tabla de Mareas Pro

Web estática (React + Vite + TypeScript) para consultar previsión de mareas, oleaje y surf en puertos de España. Sin servidor propio, sin claves de API, sin servicios de IA de pago.

## Tecnologías

- React 19 + TypeScript + Vite 6
- Tailwind CSS
- Recharts (gráfico de mareas)
- Despliegue estático en Vercel

## Fuentes de datos

- **Mareas**: modelo astronómico armónico propio (M2/S2/N2), verificado progresivamente contra los horarios publicados por el Instituto Hidrográfico de la Marina (IHM). **No es una redistribución de datos oficiales** — es una estimación. Para navegación o cualquier uso donde la precisión sea crítica, consulta siempre la fuente oficial: https://armada.defensa.gob.es/ihm
- **Meteorología y oleaje**: [Open-Meteo](https://open-meteo.com) (API abierta, gratuita, sin necesidad de clave, licencia CC BY 4.0).
- **Solunar**: salida/puesta de sol calculadas con fórmula astronómica real (NOAA) para la latitud/longitud exacta de cada puerto; fases lunares con la teoría solunar de J. A. Knight.

## Ejecutar en local

Requiere Node.js instalado.

```bash
npm install
npm run dev
```

Abre la URL que indique la terminal (normalmente `http://localhost:5173`).

## Compilar para producción

```bash
npm run build
```

Genera la carpeta `dist/`. Vercel ejecuta este mismo comando en cada despliegue.

## Publicar en GitHub + Vercel

1. Sube este proyecto a un repositorio de GitHub.
2. En Vercel: **Add New → Project** → importa el repositorio.
3. Vercel detecta Vite automáticamente (configuración ya incluida en `vercel.json`).
4. Pulsa **Deploy**.

Cada push a la rama principal genera un nuevo despliegue automático.

## Notas

- No se necesita ninguna variable de entorno ni clave de API para que la web funcione.
- No hay analítica ni cookies de terceros: solo `localStorage` en el propio navegador del usuario (favoritos, unidades, avisos).
