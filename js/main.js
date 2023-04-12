window.addEventListener("load", async () => {
    // Get today's date
    const now = new Date();
    const currentDate = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));

    // Format date to "MMM DD, YYYY" for HTML display.
    const dateString = currentDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    document.querySelector(".date-value").innerHTML = dateString;

    // Format date to "YYYY-MM-DD" for API access.
    const date = currentDate.toISOString().slice(0, 10);

    // Get list of games scheduled for today.
    const scheduleUrl = `https://statsapi.mlb.com/api/v1/schedule?sportId=1&date=${date}`;
    const res = await fetch(scheduleUrl);
    const data = await res.json();
    const schedule = data.dates[0].games;
    // console.log(schedule);

    // Use data object from first API to fetch data from another API.
    const gamePromises = schedule.map(game => getGameData(game));
    const games = await Promise.all(gamePromises);

    // Display API data in table.
    fillCells(schedule, games);
});

async function getGameData(gameObj) {
    const gameUrl = `https://statsapi.mlb.com/api/v1.1/game/${gameObj.gamePk}/feed/live?`;
    const res = await fetch(gameUrl);
    const data = await res.json();
    const gameData = data.gameData;
    // console.log(gameData);

    return {
        probablePitchers: {
          away: awayPitcher = "TBD",
          home: homePitcher = "TBD"
        },
        datetime: { dateTime: startTime },
        teams: {
          away: {
            abbreviation: awayAbbr,
            name: awayTeamName,
            record: { losses: awayLosses, wins: awayWins }
          },
          home: {
            abbreviation: homeAbbr,
            name: homeTeamName,
            record: { losses: homeLosses, wins: homeWins }
          }
        }
      } = gameData;
}

function fillCells(schedule, games) {
    console.log(schedule);      // First API data
    console.log(games);         // Second API data

    // Clear any existing rows from the table.
    const ongoingBody = document.getElementById("ongoing");
    ongoingBody.innerHTML = "";
    const finishedBody = document.getElementById("finished");
    finishedBody.innerHTML = "";

    for (let i = 0; i < schedule.length; i++) {
        // Reference variables to store API data.
        const awayAbbr = games[i].teams.away.abbreviation;
        const homeAbbr = games[i].teams.home.abbreviation;
        const awayTeam = games[i].teams.away.name;
        const homeTeam = games[i].teams.home.name;
        const awayPitcher = games[i].probablePitchers.away.fullName;
        const homePitcher = games[i].probablePitchers.home.fullName;
        const awayScore = schedule[i].teams.away.score;
        const homeScore = schedule[i].teams.home.score;
        const status = schedule[i].status.detailedState;
        const time = convertTime(games[i].datetime.dateTime);

        // Create Table Cells
        const newRow = document.createElement("tr");
        const matchupCell = document.createElement("td");
        const statusCell = document.createElement("td");
        const pitchingCell = document.createElement("td");

        // Away @ Home will always be displayed.
        matchupCell.textContent = `${awayTeam} @ ${homeTeam}`;
        newRow.appendChild(matchupCell);

        // Text and display formatting determined by the game's status.
        // Final / Postponed - Listed in lower container.
        // In Progress / Default - Listed in upper container.
        switch(status) {
            case "Final":
            case "Game Over":
                statusCell.textContent = `F ${awayAbbr} ${awayScore} / ${homeAbbr} ${homeScore}`;
                newRow.appendChild(statusCell);
                finishedBody.appendChild(newRow);
                break;
            case "Postponed":
                statusCell.textContent = status;
                newRow.appendChild(statusCell);
                finishedBody.appendChild(newRow);
                break;
            case "In Progress":
                statusCell.textContent = "LIVE";
                pitchingCell.textContent = `${awayPitcher} @ ${homePitcher}`;
                newRow.appendChild(statusCell);
                newRow.appendChild(pitchingCell);
                ongoingBody.appendChild(newRow);
                break;
            default:
                statusCell.textContent = time;
                pitchingCell.textContent = `${awayPitcher} @ ${homePitcher}`;
                newRow.appendChild(statusCell);
                newRow.appendChild(pitchingCell);
                ongoingBody.appendChild(newRow);
        }
    }
}

function convertTime(time) {
    const date = new Date(time);
    const details = {
        hour: "numeric",
        minute: "numeric",
        hour12: true,
        timeZone: "America/New_York"
    };
    const formatter = new Intl.DateTimeFormat("en-US", details);
    const formattedDate = formatter.format(date);
    return formattedDate;
}