import { useMemo, useState } from 'react'
import { useDraftBoardData } from '../hooks/useDraftBoardData'

function statusTitle(status) {
  if (status === 'loading') return 'Loading draft board'
  if (status === 'error') return 'Draft board unavailable'
  return 'Draft board'
}

export default function DraftBoardPage() {
  const { status, error, data, reload, simulateErrorLoad } = useDraftBoardData()
  const [activePosition, setActivePosition] = useState('ALL')
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState('adp-asc')

  const positions = useMemo(() => {
    if (!data?.players?.length) return ['ALL']
    const unique = Array.from(new Set(data.players.map((player) => player.position)))
    return ['ALL', ...unique]
  }, [data])

  const filteredPlayers = useMemo(() => {
    if (!data?.players) return []
    const normalizedSearch = searchText.trim().toLowerCase()

    const playersByPosition =
      activePosition === 'ALL'
        ? data.players
        : data.players.filter((player) => player.position === activePosition)

    const playersByQuery = normalizedSearch
      ? playersByPosition.filter((player) => {
          return (
            player.name.toLowerCase().includes(normalizedSearch) ||
            player.school.toLowerCase().includes(normalizedSearch)
          )
        })
      : playersByPosition

    const sorters = {
      'adp-asc': (a, b) => a.rank - b.rank,
      'expected-points': (a, b) => b.expectedPoints - a.expectedPoints || a.rank - b.rank,
      'expected-touchdowns': (a, b) => b.expectedTouchdowns - a.expectedTouchdowns || a.rank - b.rank,
      'expected-receptions': (a, b) => b.expectedReceptions - a.expectedReceptions || a.rank - b.rank,
      'expected-yards': (a, b) => b.expectedYards - a.expectedYards || a.rank - b.rank,
    }

    return [...playersByQuery].sort(sorters[sortBy])
  }, [activePosition, data, searchText, sortBy])

  return (
    <main className="draft-page" aria-live="polite">
      <header className="draft-header">
        <div>
          <p className="eyebrow">Mock Draft Simulator</p>
          <h1>{statusTitle(status)}</h1>
          <p className="subcopy">Track the active pick, queue upcoming selections, and filter top prospects.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-btn" onClick={reload}>
            Refresh
          </button>
          <button type="button" className="ghost-btn" onClick={simulateErrorLoad}>
            Simulate Error
          </button>
        </div>
      </header>

      {status === 'loading' ? (
        <section className="status-panel" role="status" aria-busy="true">
          <h2>Loading draft data...</h2>
          <p>Pulling current pick, upcoming picks, and player rankings.</p>
        </section>
      ) : null}

      {status === 'error' ? (
        <section className="status-panel error" role="alert">
          <h2>Unable to load draft data</h2>
          <p>{error}</p>
          <button type="button" className="primary-btn" onClick={reload}>
            Retry
          </button>
        </section>
      ) : null}

      {status === 'success' && data ? (
        <>
          <section className="board-grid" aria-label="Draft picks overview">
            <article className="card current-pick-card">
              <p className="card-label">Current Pick</p>
              <p className="pick-number">#{data.currentPick.number}</p>
              <h2>{data.currentPick.team}</h2>
              <p className="meta-row">
                Round {data.currentPick.round} | Record {data.currentPick.record}
              </p>
              <p className="clock-text">On the clock: {data.currentPick.onTheClockSince}</p>
            </article>

            <article className="card upcoming-card">
              <p className="card-label">Upcoming Picks</p>
              <ul className="upcoming-list">
                {data.upcomingPicks.map((pick) => (
                  <li key={pick.number} className="upcoming-item">
                    <div>
                      <strong>#{pick.number}</strong> {pick.team}
                    </div>
                    <span>{pick.need}</span>
                  </li>
                ))}
              </ul>
            </article>
          </section>

          <section className="card players-card" aria-label="Player board">
            <div className="player-board-head">
              <div>
                <p className="card-label">Players</p>
                <h2>Best Available</h2>
              </div>
              <div className="controls-wrap">
                <div className="search-wrap">
                  <label htmlFor="player-search" className="control-label">
                    Search
                  </label>
                  <input
                    id="player-search"
                    type="search"
                    className="search-input"
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                    placeholder="Name or team"
                  />
                </div>

                <div className="sort-wrap">
                  <label htmlFor="player-sort" className="control-label">
                    Sort
                  </label>
                  <select
                    id="player-sort"
                    className="sort-select"
                    value={sortBy}
                    onChange={(event) => setSortBy(event.target.value)}
                  >
                    <option value="adp-asc">Overall Ranking (Best First)</option>
                    <option value="expected-points">Expected Points</option>
                    <option value="expected-touchdowns">Expected Touchdowns</option>
                    <option value="expected-receptions">Expected Receptions</option>
                    <option value="expected-yards">Expected Yards</option>
                  </select>
                </div>

                <div className="filter-row" role="tablist" aria-label="Filter by position">
                  {positions.map((position) => {
                    const isActive = position === activePosition
                    return (
                      <button
                        key={position}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        className={`filter-pill ${isActive ? 'active' : ''}`}
                        onClick={() => setActivePosition(position)}
                      >
                        {position}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {filteredPlayers.length === 0 ? (
              <div className="empty-state" role="status">
                <h3>No players match your filters</h3>
                <p>Try another position, clear search, or change sort options.</p>
              </div>
            ) : (
              <ul className="players-list">
                {filteredPlayers.map((player) => (
                  <li key={player.id} className="player-item">
                    <div>
                      <p className="player-name">{player.name}</p>
                      <p className="player-meta">Team: {player.school}</p>
                    </div>
                    <div className="player-badges">
                      <span className="position-badge">{player.position}</span>
                      <span className="rank-badge">#{player.rank} Overall</span>
                      {player.positionRank != null && (
                        <span className="rank-badge">{player.position}{player.positionRank}</span>
                      )}
                      <span className="projection-badge">Pts {player.expectedPoints}</span>
                      <span className="projection-badge">TD {player.expectedTouchdowns}</span>
                      <span className="projection-badge">Rec {player.expectedReceptions}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      ) : null}
    </main>
  )
}
