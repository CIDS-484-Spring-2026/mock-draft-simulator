# **Fantasy Football Mock Draft Simulator**

This project is a web-based fantasy football mock draft simulator that lets a user practice for an upcoming fantasy football season by drafting against CPU-controlled teams with league-style settings.

The goal is to provide a realistic, accurate, and fast way to run mock drafts, giving you great practice before draft day.


## **Working Features**

* Draft setup popup where you can choose number of teams, your draft position, team name, and roster settings
* Snake draft logic with live current pick and upcoming picks
* Pick clock that counts down during each selection
* CPU teams that automatically make picks when it is their turn
* CPU pick logic that looks at the top available players and compares it to their current roster, making a pick based off of team needs
* Draft board with player search, sorting options, and position filters
* Draft buttons that are locked unless it is the human player's turn
* Left-side roster viewer that can cycle through every team with arrow buttons
* Starter slots and bench slots that show drafted players or Empty if the slot has not been filled yet
* Final Team popup when the draft completes, showing the human team's final roster
* Button on the Final Team popup to start a new draft
* Roster validation and error handling so invalid picks are blocked

## **Future Improvements**

* Add more CPU strategy settings like draft style or position bias controls
* Move players to a database
* Expand player data beyond the current JSON file


## **Quick Setup / Install (If You Clone This Repo)**

### **Prerequisites**

* Python 3.11+
* Node.js 18+ and npm
* Windows PowerShell

### **1. Clone the repository**

```powershell
git clone <your-repo-url>
cd mock-draft-simulator
```

### **2. Create and activate a Python virtual environment**

```powershell
python -m venv .venv
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
```

### **3. Install backend packages**

```powershell
cd backend
pip install fastapi uvicorn
cd ..
```

### **4. Install frontend packages**

```powershell
cd frontend
npm install
cd ..
```


## **How To Run The App**

### **Recommended (one command from repo root)**

From the repository root:

```powershell
.\dev.ps1
```

This starts both services together:
* FastAPI backend at `http://127.0.0.1:8000`
* Vite frontend dev server (usually `http://localhost:5173`)

### **Manual option (two terminals)**

Terminal 1 (backend):

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy RemoteSigned
.\.venv\Scripts\Activate.ps1
cd backend
python -m uvicorn main:app --reload
```

Frontend terminal:

```powershell
cd frontend
npm run dev
```


## **Reviewer Notes**

* Draft state is currently in-memory for milestone work.
* Starting a new draft from the popup sets the draft configuration used by current/upcoming pick cards.
* If testing manually, keep only one backend server running to avoid process conflicts.



## **Tech Stack**

**Frontend - React**

Will handle UI elements including the following, 
* Draft board grid
* Player list and filters
* Views of team rosters as the draft progresses
* Notifications when your pick/next pick is up


**Backend - Python (FastAPI)**

Will handle draft logic including, 
* Creating a draft
* Draft order
* Draft type (Snake, Auction, Dynasty, etc.)
* CPU pick logic
* Available players
* Sending the current draft state to the frontend


**Data - JSON -> Database**

For Milestone 1:
* Use a JSON file for simple player data

For Actual Implementation:
* Move to a database such as MongoDB
* Pull current draft rankings from ESPN, Sleeper, Yahoo, and other common fantasy football sites using API's

Need data including but not limited to, 
* Player name
* Position
* Team
* Bye Week
* Average Draft Position (ADP)
* Projected stats for each format

## **Milestone 1 Goals**

* Set project structure
* Complete initial documentation (README)
* Build React prototype
* Build FastAPI prototype
* Show that React and FastAPI can communicate
* Begin determining draft logic

## **Completed in Milestone 1**

* Set project structure
* Completed initial README
* Built FastAPI prototype

## **Milestone 2 Goals**

* Build React prototype
* Begin determining draft logic
* Dynamically get player data from a source (ESPN, Yahoo, etc.)
* Continue to work on the backend

## **Completed in Milestone 2**

* Built draft board page in react that displays draft information such as players available, a way to search for players, a way to filter players, badges to display projected points, and current pick information
* The draft board also pulls player information through the FastAPI '/players' endpoint
* Fully populated JSON file going from 20 players to ~200
* Added position rankings and overall ranking for each player
* Created a script to start both the FastAPI backend and the frontend at the same time in 1 command (.\dev.ps1)
* Researched into dynamically acquiring player data. Due to it being the NFL offseason still, there aren't true rankings available at this moment in time

## **Milestone 3 Goals**

* Add draft simulation with pick order
* Create CPU draft logic based on ADP, position need, and team strategy
* Create a roster display for each team as the draft progresses
* Move data to a database

## **Completed in Milestone 3**

* Added draft simulation with pick order (Snake order)
* Added a pick clock
* Added basic CPU draft logic
* Added 'Start Draft' button
* Added a Draft Setup to initialize the draft. Can choose team name, how many teams, what position you will draft in, roster size
* Starting a new draft refreshes the draft board
* Added roster validation for making a pick such as the maximum number of a position allowed on a team

## **Goals before end of Semester**

* MAYBE: Switch to database if time permits, not super necessary at the moment
* MAYBE: Improve CPU draft logic even further

## **Milestone Videos**

Milestone 1:
https://mediaspace.wisconsin.edu/media/Milestone+1+-+FF+Mock+Draft+Simulator/1_gcak3l37

Milestone 2:
https://mediaspace.wisconsin.edu/media/Milestone+2+-+Mock+Draft+Simulator+-+Kollin+Weikel/1_4r71dyyn

Milestone 3:
https://mediaspace.wisconsin.edu/media/Milestone+3+-++Mock+Draft+Simulator+-+Kollin+Weikel/1_m33d761l

Final Video: 
https://mediaspace.wisconsin.edu/media/Senior+Capstone+Final+Video/1_n46fd76g 