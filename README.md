# **Fantasy Football Mock Draft Simulator**

This project aims to be a web-based fantasy football mock draft simulator. A user will be able to practice for their upcoming fantasy football season by drafting with their league's rules against CPU-controlled teams. These CPU teams will draft players based on real data such as average draft position, current team needs, and more customizable criteria as well. The CPU will also have customizable settings such as draft strategy and position bias to simulate real strategies your league mates make.

This project's main goal is to help give a user realistic, accurate, and fast practice for an upcoming fantasy football draft.


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

## **Milestone Videos**

Milestone 1:
https://mediaspace.wisconsin.edu/media/Milestone+1+-+FF+Mock+Draft+Simulator/1_gcak3l37

Milestone 2:

