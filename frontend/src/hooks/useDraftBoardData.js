import { useCallback, useEffect, useState } from 'react'

const mockBoardMeta = {
  currentPick: {
    number: 12,
    round: 1,
    team: 'Kollin Placeholder',
    onTheClockSince: '00:42',
  },
  upcomingPicks: [
    { number: 13, round: 1, team: 'Seattle Orcas', need: 'Edge Rusher' },
    { number: 14, round: 1, team: 'Denver Mountaineers', need: 'Cornerback' },
    { number: 15, round: 1, team: 'Atlanta Comets', need: 'Offensive Tackle' },
    { number: 16, round: 1, team: 'Las Vegas Aces', need: 'Wide Receiver' },
  ],
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
  const [data, setData] = useState(null)

  const loadBoard = useCallback((simulateError = false) => {
    setStatus('loading')
    setError('')

    const controller = new AbortController()

    const loadAsync = async () => {
      try {
        await new Promise((resolve) => {
          window.setTimeout(resolve, 450)
        })

        if (simulateError) {
          throw new Error('Simulated error state')
        }

        const response = await fetch('/players', { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Backend responded with status ${response.status}`)
        }

        const payload = await response.json()
        const players = Array.isArray(payload.players) ? payload.players : []

        setData({
          ...mockBoardMeta,
          players: players.map(mapApiPlayerToBoardPlayer),
        })
        setStatus('success')
      } catch (fetchError) {
        if (fetchError.name === 'AbortError') {
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

  return {
    status,
    error,
    data,
    reload: () => loadBoard(false),
    simulateErrorLoad: () => loadBoard(true),
  }
}
