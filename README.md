# **Fantasy Football Mock Draft Simulator**

This project aims to be a web-based fantasy football mock draft simulator. A user will be able to practice for their upcoming fantasy football season by drafting with their league's rules against CPU controlled teams. These CPU teams will draft players based on real data such as average draft position, current team needs, and more customizable criteria as well. The CPU will also have customizable settings such as draft strategy and position bias to simulate real strategies your leaguemates make.

This project's main goal is to help give a user realistic, accurate, and fast practice for an upcoming fantasy football draft.


## **Tech Stack**

**Frontend - React**

Will handle UI elements including, 
* Draft board grid
* Player list and filters
* Views of team rosters as the draft progresses
* Notifications when your pick/next pick is up


**Backend - Python (FastAPI)**

Will handle draft logic including, 
* Creating a draft
* Draft order
* Draft type (Snake, Auction, Dynasty, etc)
* CPU pick logic
* Available players
* Sending current draft state to the frontend


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
