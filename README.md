# Premier League Refereeing Analysis

## Overview

This is a web-based system designed for analyzing Premier League refereeing decisions. Users can create accounts, log in, and access various features related to Premier League statistics, user-opiniated referee performance, and more. The system allows users to interact with data by posting decisions, commenting, sorting, filtering, and even uploading videos. Additionally, users can view a referee league table and analyze selected teams and referees.

## Installation Guide

### Prerequisites

- **Node.js**: [Download Node.js](https://nodejs.org/en)
- **Python**: [Download Python](https://www.python.org/downloads/)

### Node.js (Server.js)

To set up the Node.js environment, navigate to the project directory and run the following command to install the necessary packages:

```bash
npm install express mysql2 crypto nodemailer multer child_process
```
## Python API

For the Python environment, install the packages via the command below:
```bash
pip install requests pandas beautifulsoup4 mysql-connector-python numpy
```

## Features

- **User Account Management**: Create and manage user accounts with authentication via verification codes.
- **Premier League Statistics**: Access basic statistics related to the Premier League.
- **Decision Management**: Post, edit, and delete decisions. Users can also comment on decisions.
- **Sorting and Filtering**: Sort and filter decisions based on various criteria.
- **Video Uploads**: Upload videos related to decisions.
- **Referee League Table**: View rankings and statistics of referees in a league table format.
- **Team and Referee Analysis**: Analyze selected teams and referees with brief descriptive insights.

## Database Setup

The project uses a MySQL database to store all data. 

### For Own Server Setup and Management:

1. **Install MySQL Server**: Download and install from [MySQL Server](https://dev.mysql.com/downloads/mysql/).
2. **Set Up Database**:
   - Import the database schema using the provided SQL dump file `PremAnalysis.sql`.
   - Navigate to the MySQL bin directory in your terminal:
     ```bash
     cd "C:\Program Files\MySQL\MySQL Server X.X\bin"
     ```
     Replace `MySQL Server X.X` with your installed version.
   - Run the following command to import the schema:
     ```bash
     mysql -u username -p premier_league_analysis < path_to_backup/PremAnalysis.sql
     ```
     Replace `username` with your MySQL username and `premier_league_analysis` with your database name.

### Accessing an Existing Server:

To interact with existing databases, execute queries, and manage the schema, install MySQL Workbench from [here](https://dev.mysql.com/downloads/workbench/).

### Database Connection

The connection to the MySQL database is already configured in the relevant code files, such as `server.js`. If setting up a new server, update the connection details:

```javascript
const db = mysql.createConnection({
  host: '127.0.0.1',
  user: 'root',
  password: '...',
  database: 'premier_league_analysis'
});
```
## Running the Server
To run the Node.js server, navigate to the project directory and run the command below:

```bash
node server.js
 ```

## Contribution

Feel free to fork this repository and submit pull requests. Contributions are welcome to improve the system!


## Support

For any issues or questions, please create an issue in this repository or contact the project maintainers.
