# install packages/libraries
from fastapi import FastAPI
import json
from pathlib import Path

app = FastAPI()

# Load player data from JSON file
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
Begin Prototype for milestone 1
"""

# Temp Draft State
draft_state = {
    "player_taken": [],
    "current_pick": 1,
    "round": 1,
    "total_teams": 10,
    "order": []
}

# Start Draft
@app.post("/draft/start")
def start_draft(total_teams: int = 10):
    draft_state["player_taken"] = []
    draft_state["current_pick"] = 1
    draft_state["round"] = 1
    draft_state["total_teams"] = total_teams
    draft_state["order"] = list(range(1, total_teams + 1))
    return {"message": "Draft Started", "draft_state": draft_state}

# Pick Player
@app.post("/draft/pick")
def make_pick(player_id: int):
    draft_state["player_taken"].append(player_id)
    draft_state["current_pick"] += 1
    return {"draft_state": draft_state}

# Get current draft state
@app.get("/draft/state")
def get_draft_state():
    return {"draft_state": draft_state}