import { useEffect, useMemo, useState } from 'react'
import './App.css'

type CurrentWeather = {
  city: string
  country: string
  temp: number
  description: string
  icon: string
  feelsLike: number
  humidity: number
  windSpeed: number
  dt: number
}

type ForecastEntry = {
  date: string
  min: number
  max: number
  description: string
  icon: string
}

const formatTemp = (value: number) => `${Math.round(value)}°C`

const iconUrl = (icon: string) =>
  `https://openweathermap.org/img/wn/${icon}@2x.png`

function App() {
  const apiKey = import.meta.env.VITE_OWM_KEY as string | undefined
  const [query, setQuery] = useState('London')
  const [weather, setWeather] = useState<CurrentWeather | null>(null)
  const [forecast, setForecast] = useState<ForecastEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const apiReady = useMemo(() => Boolean(apiKey && apiKey.trim().length > 0), [apiKey])

  useEffect(() => {
    if (!apiReady) return
    void handleSearch('London')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiReady])

  const handleSearch = async (city: string) => {
    if (!apiReady) {
      setError('Set VITE_OWM_KEY in .env to fetch weather data.')
      return
    }

    if (!city.trim()) {
      setError('Please enter a city name.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [currentRes, forecastRes] = await Promise.all([
        fetch(
          `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
        ),
        fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${apiKey}&units=metric`,
        ),
      ])

      if (!currentRes.ok) {
        throw new Error('City not found. Try another search.')
      }

      const currentJson = await currentRes.json()
      const forecastJson = await forecastRes.json()

      setWeather({
        city: currentJson.name,
        country: currentJson.sys.country,
        temp: currentJson.main.temp,
        description: currentJson.weather[0].description,
        icon: currentJson.weather[0].icon,
        feelsLike: currentJson.main.feels_like,
        humidity: currentJson.main.humidity,
        windSpeed: currentJson.wind.speed,
        dt: currentJson.dt,
      })

      setForecast(buildDailyForecast(forecastJson.list ?? []))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.')
      setWeather(null)
      setForecast([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="page">
      <header className="hero">
        <p className="eyebrow">OpenWeatherMap • Netlify ready</p>
        <h1>Weather at a glance</h1>
        <p className="lede">
          Search any city to see live conditions and a five-day outlook. Data is fetched directly
          from OpenWeatherMap.
        </p>
        <form
          className="search"
          onSubmit={(e) => {
            e.preventDefault()
            void handleSearch(query)
          }}
        >
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search city (e.g., Tokyo)"
            aria-label="City search"
          />
          <button type="submit" disabled={loading}>
            {loading ? 'Loading…' : 'Get forecast'}
          </button>
        </form>
        {!apiReady && <p className="hint">Add VITE_OWM_KEY to a .env file to load real data.</p>}
        {error && <p className="error">{error}</p>}
      </header>

      <main className="grid">
        <section className="panel primary">
          {weather ? (
            <div className="current">
              <div className="current__top">
                <div>
                  <p className="label">Current</p>
                  <h2>
                    {weather.city}, {weather.country}
                  </h2>
                  <p className="muted">Updated {new Date(weather.dt * 1000).toLocaleTimeString()}</p>
                </div>
                <img src={iconUrl(weather.icon)} alt={weather.description} className="icon" />
              </div>
              <div className="temp-row">
                <span className="temp">{formatTemp(weather.temp)}</span>
                <span className="desc">{weather.description}</span>
              </div>
              <div className="stats">
                <div>
                  <p className="label">Feels like</p>
                  <p className="value">{formatTemp(weather.feelsLike)}</p>
                </div>
                <div>
                  <p className="label">Humidity</p>
                  <p className="value">{weather.humidity}%</p>
                </div>
                <div>
                  <p className="label">Wind</p>
                  <p className="value">{weather.windSpeed.toFixed(1)} m/s</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="empty">Search for a city to see the weather.</div>
          )}
        </section>

        <section className="panel forecast">
          <div className="panel__header">
            <p className="label">5-day forecast</p>
            <p className="muted">Daily high / low</p>
          </div>
          <div className="forecast-grid">
            {forecast.length > 0 ? (
              forecast.map((day) => (
                <article key={day.date} className="forecast-card">
                  <p className="label">{formatDay(day.date)}</p>
                  <img src={iconUrl(day.icon)} alt={day.description} className="icon" />
                  <p className="desc">{day.description}</p>
                  <p className="value">
                    {formatTemp(day.max)} / {formatTemp(day.min)}
                  </p>
                </article>
              ))
            ) : (
              <div className="empty">Forecast will appear after a search.</div>
            )}
          </div>
        </section>
      </main>
    </div>
  )
}

function buildDailyForecast(list: any[]): ForecastEntry[] {
  const days: Record<string, { min: number; max: number; icon: string; description: string }> = {}

  list.forEach((entry) => {
    const date = entry.dt_txt?.split(' ')[0]
    if (!date) return

    const tempMin = entry.main?.temp_min
    const tempMax = entry.main?.temp_max
    const icon = entry.weather?.[0]?.icon
    const description = entry.weather?.[0]?.description
    if (typeof tempMin !== 'number' || typeof tempMax !== 'number' || !icon || !description) return

    if (!days[date]) {
      days[date] = { min: tempMin, max: tempMax, icon, description }
      return
    }

    days[date].min = Math.min(days[date].min, tempMin)
    days[date].max = Math.max(days[date].max, tempMax)
    days[date].icon = days[date].icon || icon
    days[date].description = days[date].description || description
  })

  return Object.entries(days)
    .slice(0, 5)
    .map(([date, data]) => ({ date, ...data }))
}

function formatDay(date: string) {
  const d = new Date(date)
  return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })
}

export default App
