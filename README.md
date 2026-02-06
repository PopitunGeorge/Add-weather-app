# Weather Forecast App

Search for any city to view current conditions and a five-day forecast powered by OpenWeatherMap. Built with React, TypeScript, and Vite, ready for Netlify hosting.

## Quickstart

1) Install dependencies

```sh
npm install
```

2) Create an environment file

```sh
cp .env.example .env
# set VITE_OWM_KEY to your OpenWeatherMap API key
```

3) Run the dev server

```sh
npm run dev
```

4) Build for production

```sh
npm run build
```

## Deployment (Netlify)

- Build command: `npm run build`
- Publish directory: `dist`
- Environment variables: set `VITE_OWM_KEY`

## Notes

- The OpenWeatherMap free tier supports current weather and 5-day/3-hour forecast used here.
- Vite 7 expects Node 20.19+ or 22.12+. If you see engine warnings on older Node 20.x, upgrade Node for best compatibility.
