Premier League Refereeing Analysis

Requirements
Node.js: Pre-Installed
Python: Pre-Installed
Terminal or cmd prompt access
Web-Browser access

Information about this repository
A Web-based System designed for user account creation in order to access features.
Users will log in and verify and validate login information via authentication codes.
The many features for users to access are:
Basic Premier League Statistics
Decision Posting, Editing and Deletion
Decision Commenting
Decision Sorting and Filtering
Video Upload for Decision
Viewable Referee League Table
Analysis of selected Teams and Referees
Brief Analytic Descriptions for selected Teams and Referees

Database
The code utilizes a MySQL database schema, which contains tables to store every data.
For Own Server Setup and Management: MySQL Server is needed: https://dev.mysql.com/downloads/mysql/
For accessing an existing Server, to interact wth databases, execute queries etc, please install MySQL Workbench: https://dev.mysql.com/downloads/workbench/
The connection to the database is already present in every code iteration requiring it such as server.js, as an existing Server connection:

// Database connection setup
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '...',
  database: 'premier_league_analysis'
});


For any new servers created, users will need to enter their own connection details.
This also means a new database schema to be created, an import dump is present via the file 'PremAnalysis.sql'
To import this, please navigate to the correct directory from the command line below:
cd "C:\Program Files\MySQL\MySQL Server X.X\bin"
NOTE: replace 'MySQL Server X.X' with the server version you have installed.
Next please run the command line below to copy the essential database schema information:
mysql -u username -p premier_league_analysis < path_to_backup/PremAnalysis.sql
NOTE: you will need to change username, to a username created during server setup, as well as premier_league_analysis to the name of the database that will be injected.
Finally please find the correct path to where the PremAnalysis.sql file is stored.

Package Installation
Below are command lines to install the necessary packages for the server.js and the Python API files:

Server.js (Node.js)
Before installation of Node.js Libraries, be sure to install Node.js first.
Link: https://nodejs.org/en

Python
Before installation of Python Libraries, please ensure Python is installed first.
Link: https://www.python.org/downloads/

Installation

npm install express mysql2 crypto nodemailer multer child_process



Python API

Installation

pip install requests pandas beautifulsoup4 mysql-connector-python numpy
