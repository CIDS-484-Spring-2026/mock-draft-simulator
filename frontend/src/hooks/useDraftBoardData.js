import { useCallback, useEffect, useState } from 'react'

const mockBoardMeta = {
  currentPick: {
    number: 12,
    round: 1,
    team: 'Kollin Placeholder',
    pickInRound: 1,
    secondsLeft: 60,
  },
  upcomingPicks: [
    { number: 13, round: 1, team: 'CPU Team 2', pickInRound: 2 },
    { number: 14, round: 1, team: 'CPU Team 3', pickInRound: 3 },
    { number: 15, round: 1, team: 'CPU Team 4', pickInRound: 4 },
    { number: 16, round: 1, team: 'CPU Team 5', pickInRound: 5 },
  ],
}

function toClock(secondsLeft) {
  const safeSeconds = Math.max(0, Number(secondsLeft) || 0)
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function getProjectionByPosition(position) {
  const presets = {
    QB: { points: 305, touchdowns: 28, receptions: 0, yards: 4100 },
    RB: { points: 248, touchdowns: 11, receptions: 44, yards: 1325 },
    WR: { points: 232, touchdowns: 9, receptions: 86, yards: 1180 },
    TE: { points: 168, touchdowns: 7, receptions: 63, yards: 780 },
    FLEX: { points: 185, touchdowns: 7, receptions: 40, yards: 880 },
  }
  return presets[position] ?? presets.FLEX
}

function mapApiPlayerToBoardPlayer(player, index) {
  const position = player.position ?? 'FLEX'
  const overallRank = Number(player.overall_rank) || index + 1
  const baseline = getProjectionByPosition(position)
  const rankAdjustment = Math.max(0, 12 - overallRank) * 1.4

  return {
    id: player.id ?? index + 1,
    name: player.name ?? `Player ${index + 1}`,
    position,
    school: player.team ?? 'N/A',
    rank: overallRank,
    positionRank: Number(player.position_rank) || null,
    expectedPoints: Number((baseline.points + rankAdjustment).toFixed(1)),
    expectedTouchdowns: Math.max(1, Math.round(baseline.touchdowns + rankAdjustment / 4)),
    expectedReceptions: Math.max(0, Math.round(baseline.receptions + rankAdjustment / 3)),
    expectedYards: Math.round(baseline.yards + rankAdjustment * 18),
  }
}

export function useDraftBoardData() {
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [draftActionError, setDraftActionError] = useState('')
  const [draftingPlayerId, setDraftingPlayerId] = useState(null)
  const [isStartingDraft, setIsStartingDraft] = useState(false)
  const [startDraftError, setStartDraftError] = useState('')
  const [data, setData] = useState(null)

  const loadBoard = useCallback((simulateError = false, options = {}) => {
    const { silent = false } = options

    if (!silent) {
      setStatus('loading')
      setError('')
    }

    const controller = new AbortController()

    const loadAsync = async () => {
      try {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 450)
        })

        if (simulateError) {
          throw new Error('Simulated error state')
        }

        const [availableResponse, stateResponse] = await Promise.all([
          fetch('/draft/available', { signal: controller.signal }),
          fetch('/draft/state', { signal: controller.signal }),
        ])

        if (!availableResponse.ok) {
          throw new Error(`Backend responded with status ${availableResponse.status}`)
        }
        if (!stateResponse.ok) {
          throw new Error(`Backend responded with status ${stateResponse.status}`)
        }

        const availablePayload = await availableResponse.json()
        const statePayload = await stateResponse.json()

        const players = Array.isArray(availablePayload?.players) ? availablePayload.players : []
        const draftState = statePayload?.draft_state ?? {}
        const currentPick = draftState?.current_pick ?? {}
        const upcomingPicks = Array.isArray(draftState?.upcoming_picks) ? draftState.upcoming_picks : []

        setData({
          currentPick: {
            number: currentPick.number ?? mockBoardMeta.currentPick.number,
            round: currentPick.round ?? mockBoardMeta.currentPick.round,
            pickInRound: currentPick.pick_in_round ?? mockBoardMeta.currentPick.pickInRound,
            team: currentPick.team ?? mockBoardMeta.currentPick.team,
            secondsLeft: currentPick.seconds_left ?? mockBoardMeta.currentPick.secondsLeft,
            onTheClockSince: toClock(currentPick.seconds_left ?? mockBoardMeta.currentPick.secondsLeft),
          },
          upcomingPicks: upcomingPicks.map((pick, index) => ({
            number: pick.number ?? index + 1,
            round: pick.round ?? 1,
            pickInRound: pick.pick_in_round ?? index + 1,
            team: pick.team ?? `CPU Team ${index + 1}`,
          })),
          players: players.map(mapApiPlayerToBoardPlayer),
        })
        setStatus('success')
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
          return
        }
        if (silent) {
          return
        }
        setStatus('error')
        setData(null)
        setError('Could not load players from backend. Start FastAPI and try again.')
      }
    }

    loadAsync()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    const cleanup = loadBoard(false)
    return cleanup
  }, [loadBoard])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      loadBoard(false, { silent: true })
    }, 2000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [loadBoard])

  const draftPlayer = useCallback(
    async (playerId) => {
      setDraftActionError('')
      setDraftingPlayerId(playerId)

      try {
        const response = await fetch(`/draft/pick?player_id=${encodeURIComponent(playerId)}`, {
          method: 'POST',
        })

        if (!response.ok) {
          let detail = 'Unable to draft this player right now.'
          try {
            const payload = await response.json()
            if (payload?.detail) {
              detail = payload.detail
            }
          } catch {
            // Ignore JSON parse issues and use default detail message.
          }
          throw new Error(detail)
        }

        await response.json()
        loadBoard(false, { silent: true })
      } catch (pickError) {
        setDraftActionError(pickError.message || 'Unable to draft this player right now.')
      } finally {
        setDraftingPlayerId(null)
      }
    },
    [loadBoard],
  )

  const startDraft = useCallback(
    async ({ totalTeams, humanTeam, humanTeamName, roster }) => {
      setStartDraftError('')
      setDraftActionError('')
      setIsStartingDraft(true)

      try {
        const totalRounds =
          Number(roster.qb || 0) +
          Number(roster.rb || 0) +
          Number(roster.wr || 0) +
          Number(roster.te || 0) +
          Number(roster.flex || 0) +
          Number(roster.k || 0) +
          Number(roster.dst || 0) +
          Number(roster.bench || 0) +
          Number(roster.superflex || 0)

        const response = await fetch('/draft/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            total_teams: Number(totalTeams),
            human_team: Number(humanTeam),
            human_team_name: (humanTeamName || '').trim() || 'Your Team',
            roster,
          }),
        })

        if (!response.ok) {
          let detail = 'Unable to start a new draft right now.'
          try {
            const payload = await response.json()
            if (payload?.detail) {
              detail = payload.detail
            }
          } catch {
            // Ignore JSON parse issues and use default detail message.
          }
          throw new Error(detail)
        }

        const payload = await response.json()

        const draftState = payload?.draft_state ?? {}
        const appliedTeams = Number(draftState?.total_teams)
        const appliedHumanTeam = Number(draftState?.human_team)

        if (appliedTeams !== Number(totalTeams) || appliedHumanTeam !== Number(humanTeam)) {
          const fallbackResponse = await fetch(
            `/draft/start?total_teams=${encodeURIComponent(totalTeams)}&total_rounds=${encodeURIComponent(
              totalRounds,
            )}&human_team=${encodeURIComponent(humanTeam)}`,
            {
              method: 'POST',
            },
          )

          if (!fallbackResponse.ok) {
            throw new Error('Draft settings were not applied. Restart backend and try again.')
          }
        }

        loadBoard(false)
        return true
      } catch (startError) {
        setStartDraftError(startError.message || 'Unable to start a new draft right now.')
        return false
      } finally {
        setIsStartingDraft(false)
      }
    },
    [loadBoard],
  )

  return {
    status,
    error,
    draftActionError,
    draftingPlayerId,
    isStartingDraft,
    startDraftError,
    data,
    draftPlayer,
    startDraft,
    reload: () => loadBoard(false),
  }
}
