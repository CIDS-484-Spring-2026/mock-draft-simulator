# install packages/libraries
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
import json
from pathlib import Path
from typing import Dict, List
import time

app = FastAPI()

# Load player data from a JSON file
DATA_PATH = Path(__file__).parent / "examplePlayers.json"

# Find JSON
def load_players():
    with open(DATA_PATH, "r") as f:
        return json.load(f)

# Confirm API worked and is running
@app.get("/")
def root():
    return {"message": "Fantasy Football Mock Draft Simulator API running"}

# Return players
@app.get("/players")
def get_players():
    players = load_players()
    return {"players": players}

"""
Begin Draft Engine
"""


def build_player_lookup() -> Dict[int, dict]:
    players = load_players()
    return {int(player["id"]): player for player in players if "id" in player}


def current_team_for_pick(total_teams: int, direction: int, pick_in_round: int) -> int:
    if direction == 1:
        return pick_in_round
    return total_teams - pick_in_round + 1


class RosterSettings(BaseModel):
    qb: int = Field(default=1, ge=0)
    rb: int = Field(default=2, ge=0)
    wr: int = Field(default=3, ge=0)
    te: int = Field(default=1, ge=0)
    flex: int = Field(default=0, ge=0)
    k: int = Field(default=1, ge=0)
    dst: int = Field(default=1, ge=0)
    bench: int = Field(default=6, ge=0)
    superflex: int = Field(default=0, ge=0)


class DraftStartRequest(BaseModel):
    total_teams: int = Field(default=10, ge=2)
    human_team: int = Field(default=1, ge=1)
    human_team_name: str = Field(default="Your Team", min_length=1, max_length=40)
    roster: RosterSettings = Field(default_factory=RosterSettings)


def total_rounds_from_roster(roster: RosterSettings) -> int:
    total_slots = (
        roster.qb
        + roster.rb
        + roster.wr
        + roster.te
        + roster.flex
        + roster.k
        + roster.dst
        + roster.bench
        + roster.superflex
    )
    return max(1, total_slots)


def starter_slots_total(roster_settings: dict) -> int:
    return sum(
        int(roster_settings.get(slot, 0))
        for slot in ["qb", "rb", "wr", "te", "flex", "k", "dst", "superflex"]
    )


def roster_capacity(roster_settings: dict) -> int:
    return starter_slots_total(roster_settings) + int(roster_settings.get("bench", 0))


def empty_position_counts() -> Dict[str, int]:
    return {"QB": 0, "RB": 0, "WR": 0, "TE": 0, "K": 0, "DST": 0}


def count_roster_positions(team_roster: List[dict]) -> Dict[str, int]:
    counts = empty_position_counts()
    for pick in team_roster:
        position = pick.get("position", "")
        if position in counts:
            counts[position] += 1
    return counts


def filled_starter_slots(position_counts: Dict[str, int], roster_settings: dict) -> Dict[str, int]:
    filled = {
        "qb": min(position_counts["QB"], int(roster_settings.get("qb", 0))),
        "rb": min(position_counts["RB"], int(roster_settings.get("rb", 0))),
        "wr": min(position_counts["WR"], int(roster_settings.get("wr", 0))),
        "te": min(position_counts["TE"], int(roster_settings.get("te", 0))),
        "k": min(position_counts["K"], int(roster_settings.get("k", 0))),
        "dst": min(position_counts["DST"], int(roster_settings.get("dst", 0))),
        "flex": 0,
        "superflex": 0,
    }

    remaining = {
        "QB": position_counts["QB"] - filled["qb"],
        "RB": position_counts["RB"] - filled["rb"],
        "WR": position_counts["WR"] - filled["wr"],
        "TE": position_counts["TE"] - filled["te"],
        "K": position_counts["K"] - filled["k"],
        "DST": position_counts["DST"] - filled["dst"],
    }

    flex_open = int(roster_settings.get("flex", 0))
    for position in ["RB", "WR", "TE"]:
        if flex_open <= 0:
            break
        used = min(remaining[position], flex_open)
        filled["flex"] += used
        remaining[position] -= used
        flex_open -= used

    superflex_open = int(roster_settings.get("superflex", 0))
    for position in ["QB", "RB", "WR", "TE"]:
        if superflex_open <= 0:
            break
        used = min(remaining[position], superflex_open)
        filled["superflex"] += used
        remaining[position] -= used
        superflex_open -= used

    return filled


def starters_filled_count(position_counts: Dict[str, int], roster_settings: dict) -> int:
    filled = filled_starter_slots(position_counts, roster_settings)
    return sum(filled.values())


def remaining_starter_slots(position_counts: Dict[str, int], roster_settings: dict) -> int:
    return starter_slots_total(roster_settings) - starters_filled_count(position_counts, roster_settings)


def team_roster_after_pick(state: dict, team_id: int, player_position: str) -> Dict[str, int]:
    counts = count_roster_positions(state["rosters"].get(str(team_id), []))
    if player_position in counts:
        counts[player_position] += 1
    return counts


def pick_roster_validation(state: dict, team_id: int, player_position: str) -> str | None:
    roster_settings = state.get("roster_settings", {})
    team_roster = state["rosters"].get(str(team_id), [])
    current_size = len(team_roster)
    max_size = roster_capacity(roster_settings)

    if current_size >= max_size:
        return "This roster is already full."

    next_counts = team_roster_after_pick(state, team_id, player_position)
    next_size = current_size + 1
    remaining_slots_after_pick = max_size - next_size
    remaining_starters_after_pick = remaining_starter_slots(next_counts, roster_settings)

    if remaining_starters_after_pick > remaining_slots_after_pick:
        return f"Drafting another {player_position} would leave too few spots to finish your starting lineup."

    return None


def roster_fit_score(state: dict, team_id: int, player_position: str) -> tuple:
    roster_settings = state.get("roster_settings", {})
    current_counts = count_roster_positions(state["rosters"].get(str(team_id), []))
    current_remaining = remaining_starter_slots(current_counts, roster_settings)
    next_counts = team_roster_after_pick(state, team_id, player_position)
    next_remaining = remaining_starter_slots(next_counts, roster_settings)
    fills_need = current_remaining - next_remaining
    next_starters_filled = starters_filled_count(next_counts, roster_settings)
    next_bench_used = max(0, sum(next_counts.values()) - next_starters_filled)
    return (fills_need, -next_bench_used)


def create_empty_draft_state(
    total_teams: int,
    total_rounds: int,
    human_team: int,
    roster: dict = None,
    human_team_name: str = "Your Team",
) -> dict:
    rosters = {str(team_id): [] for team_id in range(1, total_teams + 1)}
    clean_team_name = (human_team_name or "Your Team").strip() or "Your Team"
    team_names = {
        str(team_id): (clean_team_name if team_id == human_team else f"CPU Team {team_id}")
        for team_id in range(1, total_teams + 1)
    }
    return {
        "is_active": True,
        "is_complete": False,
        "total_teams": total_teams,
        "total_rounds": total_rounds,
        "human_team": human_team,
        "round": 1,
        "pick_in_round": 1,
        "overall_pick": 1,
        "direction": 1,
        "team_on_clock": 1,
        "taken_player_ids": [],
        "picks": [],
        "rosters": rosters,
        "team_names": team_names,
        "pick_clock_seconds": 60,
        "cpu_pick_delay_seconds": 3,
        "pick_started_at": int(time.time()),
        "roster_settings": roster or RosterSettings().model_dump(),
    }


draft_state = create_empty_draft_state(total_teams=10, total_rounds=16, human_team=1, human_team_name="Your Team")


def advance_to_next_pick(state: dict) -> None:
    if state["is_complete"]:
        return

    if state["pick_in_round"] < state["total_teams"]:
        state["pick_in_round"] += 1
    else:
        state["round"] += 1
        if state["round"] > state["total_rounds"]:
            state["is_complete"] = True
            state["is_active"] = False
            return
        state["pick_in_round"] = 1
        state["direction"] *= -1

    state["overall_pick"] = (state["round"] - 1) * state["total_teams"] + state["pick_in_round"]
    state["team_on_clock"] = current_team_for_pick(
        total_teams=state["total_teams"],
        direction=state["direction"],
        pick_in_round=state["pick_in_round"],
    )
    state["pick_started_at"] = int(time.time())


def upcoming_teams(state: dict, count: int = 4) -> List[int]:
    preview = []
    round_num = state["round"]
    pick_in_round = state["pick_in_round"]
    direction = state["direction"]

    while len(preview) < count and round_num <= state["total_rounds"]:
        team_id = current_team_for_pick(state["total_teams"], direction, pick_in_round)
        preview.append(team_id)

        if pick_in_round < state["total_teams"]:
            pick_in_round += 1
        else:
            round_num += 1
            pick_in_round = 1
            direction *= -1

    return preview


def best_available_player(players: List[dict], taken_ids: set, state: dict = None, team_id: int = None) -> dict:
    available = [player for player in players if int(player.get("id", -1)) not in taken_ids]
    if not available:
        return None

    def player_sort_key(player: dict):
        fit_score = (0, 0)
        if state is not None and team_id is not None:
            fit_score = roster_fit_score(state, team_id, player.get("position", ""))
        rank = player.get("overall_rank")
        rank_value = int(rank) if rank is not None else 10**9
        player_id = int(player.get("id", 10**9))
        return (-fit_score[0], -fit_score[1], rank_value, player_id)

    return min(available, key=player_sort_key)


def maybe_auto_pick_for_cpus(state: dict) -> None:
    if not state.get("is_active") or state.get("is_complete"):
        return

    cpu_pick_delay_seconds = int(state.get("cpu_pick_delay_seconds", 3))
    players = load_players()
    max_auto_picks_per_call = 4

    for _ in range(max_auto_picks_per_call):
        if not state.get("is_active") or state.get("is_complete"):
            return

        team_on_clock = int(state.get("team_on_clock", 1))
        human_team = int(state.get("human_team", 1))
        if team_on_clock == human_team:
            return

        now_ts = int(time.time())
        pick_started_at = int(state.get("pick_started_at", now_ts))
        elapsed = max(0, now_ts - pick_started_at)
        if elapsed < cpu_pick_delay_seconds:
            return

        taken_ids = set(state.get("taken_player_ids", []))
        valid_candidates = [
            player
            for player in players
            if int(player.get("id", -1)) not in taken_ids
            and pick_roster_validation(state, team_on_clock, player.get("position", "")) is None
        ]
        selected_player = best_available_player(valid_candidates, taken_ids, state=state, team_id=team_on_clock)
        if not selected_player:
            state["is_complete"] = True
            state["is_active"] = False
            return

        player_id = int(selected_player["id"])
        pick_event = {
            "overall_pick": state["overall_pick"],
            "round": state["round"],
            "pick_in_round": state["pick_in_round"],
            "team_id": team_on_clock,
            "player_id": player_id,
            "player_name": selected_player.get("name", "Unknown Player"),
            "position": selected_player.get("position", "N/A"),
            "is_auto_pick": True,
        }

        state["taken_player_ids"].append(player_id)
        state["picks"].append(pick_event)
        state["rosters"][str(team_on_clock)].append(pick_event)
        advance_to_next_pick(state)


def draft_summary(state: dict) -> dict:
    now_ts = int(time.time())
    clock_seconds = int(state.get("pick_clock_seconds", 60))
    pick_started_at = int(state.get("pick_started_at", now_ts))
    elapsed = max(0, now_ts - pick_started_at)
    seconds_left = 0 if state.get("is_complete") else max(0, clock_seconds - elapsed)

    team_names = state.get("team_names", {})
    team_on_clock = state.get("team_on_clock", 1)

    current_pick_payload = {
        "number": state.get("overall_pick", 1),
        "round": state.get("round", 1),
        "pick_in_round": state.get("pick_in_round", 1),
        "team_id": team_on_clock,
        "team": team_names.get(str(team_on_clock), f"Team {team_on_clock}"),
        "seconds_left": seconds_left,
    }

    upcoming = []
    round_num = state.get("round", 1)
    pick_in_round = state.get("pick_in_round", 1)
    direction = state.get("direction", 1)
    for _ in range(4):
        if round_num > state.get("total_rounds", 1):
            break

        if pick_in_round < state.get("total_teams", 1):
            next_pick_in_round = pick_in_round + 1
            next_round = round_num
            next_direction = direction
        else:
            next_round = round_num + 1
            if next_round > state.get("total_rounds", 1):
                break
            next_pick_in_round = 1
            next_direction = direction * -1

        next_overall = (next_round - 1) * state.get("total_teams", 1) + next_pick_in_round
        next_team_id = current_team_for_pick(state.get("total_teams", 1), next_direction, next_pick_in_round)
        upcoming.append(
            {
                "number": next_overall,
                "round": next_round,
                "pick_in_round": next_pick_in_round,
                "team_id": next_team_id,
                "team": team_names.get(str(next_team_id), f"Team {next_team_id}"),
            }
        )

        round_num = next_round
        pick_in_round = next_pick_in_round
        direction = next_direction

    return {
        **state,
        "total_picks": state["total_teams"] * state["total_rounds"],
        "upcoming_teams": upcoming_teams(state),
        "current_pick": current_pick_payload,
        "upcoming_picks": upcoming,
    }


# Start Draft
@app.post("/draft/start")
def start_draft(request: DraftStartRequest):
    total_rounds = total_rounds_from_roster(request.roster)

    if request.human_team < 1 or request.human_team > request.total_teams:
        raise HTTPException(status_code=400, detail="human_team must be between 1 and total_teams")

    global draft_state
    draft_state = create_empty_draft_state(
        total_teams=request.total_teams,
        total_rounds=total_rounds,
        human_team=request.human_team,
        roster=request.roster.model_dump(),
        human_team_name=request.human_team_name,
    )
    return {"message": "Draft started", "draft_state": draft_summary(draft_state)}


# Pick Player
@app.post("/draft/pick")
def make_pick(player_id: int, team_id: int = None):
    maybe_auto_pick_for_cpus(draft_state)

    if not draft_state["is_active"]:
        raise HTTPException(status_code=400, detail="Draft is not active. Start a draft first.")
    if draft_state["is_complete"]:
        raise HTTPException(status_code=400, detail="Draft is already complete.")

    team_making_pick = draft_state["team_on_clock"] if team_id is None else team_id

    if team_making_pick != draft_state["team_on_clock"]:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid team turn. Team {draft_state['team_on_clock']} is on the clock.",
        )

    players_by_id = build_player_lookup()
    selected_player = players_by_id.get(player_id)
    if not selected_player:
        raise HTTPException(status_code=404, detail="Player not found")

    if player_id in draft_state["taken_player_ids"]:
        raise HTTPException(status_code=400, detail="Player already drafted")

    roster_error = pick_roster_validation(draft_state, team_making_pick, selected_player.get("position", ""))
    if roster_error:
        raise HTTPException(status_code=400, detail=roster_error)

    pick_event = {
        "overall_pick": draft_state["overall_pick"],
        "round": draft_state["round"],
        "pick_in_round": draft_state["pick_in_round"],
        "team_id": team_making_pick,
        "player_id": player_id,
        "player_name": selected_player.get("name", "Unknown Player"),
        "position": selected_player.get("position", "N/A"),
    }

    draft_state["taken_player_ids"].append(player_id)
    draft_state["picks"].append(pick_event)
    draft_state["rosters"][str(team_making_pick)].append(pick_event)

    advance_to_next_pick(draft_state)
    return {"message": "Pick recorded", "pick": pick_event, "draft_state": draft_summary(draft_state)}


# Get current draft state
@app.get("/draft/state")
def get_draft_state():
    maybe_auto_pick_for_cpus(draft_state)
    return {"draft_state": draft_summary(draft_state)}


# Return all undrafted players
@app.get("/draft/available")
def get_available_players():
    maybe_auto_pick_for_cpus(draft_state)
    taken_ids = set(draft_state["taken_player_ids"])
    available = [player for player in load_players() if int(player.get("id", -1)) not in taken_ids]
    return {"count": len(available), "players": available}