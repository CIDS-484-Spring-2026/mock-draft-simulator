import { useMemo, useState } from 'react'
import { useDraftBoardData } from '../hooks/useDraftBoardData'

function statusTitle(status) {
  if (status === 'loading') return 'Loading draft board'
  if (status === 'error') return 'Draft board unavailable'
  return 'Draft board'
}

export default function DraftBoardPage() {
  const {
    status,
    error,
    draftActionError,
    draftingPlayerId,
    isStartingDraft,
    startDraftError,
    data,
    draftPlayer,
    startDraft,
    reload,
  } = useDraftBoardData()
  const [activePosition, setActivePosition] = useState('ALL')
  const [searchText, setSearchText] = useState('')
  const [sortBy, setSortBy] = useState('adp-asc')
  const [isSetupOpen, setIsSetupOpen] = useState(true)
  const [teamName, setTeamName] = useState('Your Team')
  const [totalTeams, setTotalTeams] = useState(12)
  const [humanPick, setHumanPick] = useState(6)
  const [roster, setRoster] = useState({
    qb: 1,
    rb: 2,
    wr: 3,
    te: 1,
    flex: 0,
    k: 1,
    dst: 1,
    bench: 6,
    superflex: 0,
  })

  const totalRounds =
    roster.qb + roster.rb + roster.wr + roster.te + roster.flex + roster.k + roster.dst + roster.bench + roster.superflex

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

  const draftPositionOptions = useMemo(() => {
    return Array.from({ length: totalTeams }, (_, index) => index + 1)
  }, [totalTeams])

  const handleRandomizeDraftPosition = () => {
    const randomPick = Math.floor(Math.random() * totalTeams) + 1
    setHumanPick(randomPick)
  }

  const handleRosterChange = (slot, value) => {
    setRoster((previous) => ({
      ...previous,
      [slot]: Number(value),
    }))
  }

  const handleTotalTeamsChange = (value) => {
    const nextTeams = Number(value)
    setTotalTeams(nextTeams)
    if (humanPick > nextTeams) {
      setHumanPick(nextTeams)
    }
  }

  const handleStartDraft = async (event) => {
    event.preventDefault()
    const started = await startDraft({
      totalTeams,
      humanTeam: humanPick,
      humanTeamName: teamName,
      roster,
    })

    if (started) {
      setIsSetupOpen(false)
    }
  }

  return (
    <main className="draft-page" aria-live="polite">
      {isSetupOpen ? (
        <section className="draft-setup-overlay" role="dialog" aria-modal="true" aria-label="Draft setup">
          <div className="draft-setup-modal card">
            <p className="card-label">Draft Setup</p>
            <h2>Start Your Mock Draft</h2>
            <p className="subcopy">Choose league settings before the board opens. Position counts below are starter slots, and bench adds extra roster spots for backups.</p>

            <form className="draft-setup-form" onSubmit={handleStartDraft}>
              <div className="setup-field">
                <label htmlFor="setup-team-name" className="control-label">
                  Team Name
                </label>
                <input
                  id="setup-team-name"
                  type="text"
                  className="search-input"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  maxLength={40}
                  placeholder="Your Team"
                  required
                />
              </div>

              <div className="setup-field">
                <label htmlFor="setup-teams" className="control-label">
                  # of Teams
                </label>
                <select
                  id="setup-teams"
                  className="sort-select"
                  value={totalTeams}
                  onChange={(event) => handleTotalTeamsChange(event.target.value)}
                >
                  {[8, 10, 12, 14, 16].map((count) => (
                    <option key={count} value={count}>
                      {count}
                    </option>
                  ))}
                </select>
              </div>

              <div className="setup-row">
                <div className="setup-field">
                  <label htmlFor="setup-pick" className="control-label">
                    Draft Position
                  </label>
                  <select
                    id="setup-pick"
                    className="sort-select"
                    value={humanPick}
                    onChange={(event) => setHumanPick(Number(event.target.value))}
                  >
                    {draftPositionOptions.map((pick) => (
                      <option key={pick} value={pick}>
                        {pick}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="setup-field setup-button-wrap">
                  <label className="control-label">&nbsp;</label>
                  <button type="button" className="ghost-btn" onClick={handleRandomizeDraftPosition}>
                    Randomize
                  </button>
                </div>
              </div>

              <div className="roster-section">
                <h3>Starter Slots and Bench</h3>
                <div className="roster-grid">
                  {[
                    ['QB', 'qb', 0, 3],
                    ['RB', 'rb', 0, 6],
                    ['WR', 'wr', 0, 6],
                    ['TE', 'te', 0, 3],
                    ['Flex', 'flex', 0, 3],
                    ['K', 'k', 0, 2],
                    ['DST', 'dst', 0, 2],
                    ['Bench', 'bench', 0, 12],
                    ['SuperFlex', 'superflex', 0, 2],
                  ].map(([label, key, min, max]) => (
                    <div key={key} className="setup-field">
                      <label htmlFor={`roster-${key}`} className="control-label control-label-inline">
                        {label}
                      </label>
                      <select
                        id={`roster-${key}`}
                        className="sort-select"
                        value={roster[key]}
                        onChange={(event) => handleRosterChange(key, event.target.value)}
                      >
                        {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((slotCount) => (
                          <option key={slotCount} value={slotCount}>
                            {slotCount}
                          </option>
                        ))}
                      </select>
                    </div>
                  ))}
                </div>
                <p className="setup-summary">Total Draft Rounds: {totalRounds}</p>
              </div>

              {startDraftError ? (
                <div className="status-panel error" role="alert">
                  <p>{startDraftError}</p>
                </div>
              ) : null}

              <div className="setup-actions">
                <button type="submit" className="primary-btn" disabled={isStartingDraft}>
                  {isStartingDraft ? 'Starting Draft...' : 'Start Draft'}
                </button>
              </div>
            </form>
          </div>
        </section>
      ) : null}

      <header className="draft-header">
        <div>
          <p className="eyebrow">Mock Draft Simulator</p>
          <h1>{statusTitle(status)}</h1>
          <p className="subcopy">Track the active pick, queue upcoming selections, and filter top prospects.</p>
        </div>
        <div className="header-actions">
          <button type="button" className="ghost-btn" onClick={() => setIsSetupOpen(true)}>
            Start New Draft
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
                Round {data.currentPick.round} | Pick {data.currentPick.pickInRound}
              </p>
              <p className="clock-text">On the clock: {data.currentPick.onTheClockSince} remaining</p>
            </article>

            <article className="card upcoming-card">
              <p className="card-label">Upcoming Picks</p>
              <ul className="upcoming-list">
                {data.upcomingPicks.map((pick) => (
                  <li key={pick.number} className="upcoming-item">
                    <div>
                      <strong>#{pick.number}</strong> {pick.team}
                    </div>
                    <span>
                      R{pick.round} P{pick.pickInRound}
                    </span>
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

            {draftActionError ? (
              <div className="status-panel error" role="alert">
                <p>{draftActionError}</p>
              </div>
            ) : null}

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
                    <div className="player-actions">
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
                      <button
                        type="button"
                        className="draft-btn"
                        onClick={() => draftPlayer(player.id)}
                        disabled={draftingPlayerId === player.id || isSetupOpen || isStartingDraft}
                      >
                        {draftingPlayerId === player.id ? 'Drafting...' : 'Draft'}
                      </button>
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
