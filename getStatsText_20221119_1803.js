function getStatsText(boardShare) {
  const squareCorrect = "🟩";
  const squarePresent = "🟨";
  const squareMissing = "⬛️";
  
  var req = new XMLHttpRequest();
  req.open("GET", "https://www.nytimes.com/svc/games/state/wordle/latest", false);
  req.send();
  
  var data = JSON.parse(req.responseText);

  let {game_data: {game, settings, stats}} = data;
  
  return JSON.stringify(game);

  let puzzleNum = game.dayOffset;
  let gameWon = (game.status == "WIN");
  let solution = gameWon ? game.boardState[game.currentRowIndex - 1] : null;
  let guesses = game.boardState.filter(guess => !!guess);
  
  function getBlocks(guess, num) {
    return guess.map(l => l == "correct" ? squareCorrect : (l == "present" ? squarePresent : squareMissing)).join("");
  }

  function getBoard(guesses) {
    boardShare = (boardShare ?? "").trim();

    if (boardShare.length > 0) {
      let firstCorrect = boardShare.indexOf(squareCorrect);
      let firstPresent = boardShare.indexOf(squarePresent);
      let firstMissing = boardShare.indexOf(squareMissing);

      let firstSquare = Math.min(firstCorrect, firstPresent, firstMissing);
      let boardOnly = boardShare.substr(firstSquare);

      return boardOnly;
    }

    return guesses.filter(guess => !!guess).map(getBlocks).join("\n");
  }

  function getBar(guesses, num) {
    let count = guesses[num];
    let eights = "⣿".repeat(Math.floor(count/8));
    let remainder = count % 8;
    let dots = "";

    if (count > 0) switch (remainder) {
      case 0: dots = "⠀"; break;
      case 1: dots = "⠁"; break;
      case 2: dots = "⠃"; break;
      case 3: dots = "⠇"; break;
      case 4: dots = "⡇"; break;
      case 5: dots = "⡏"; break;
      case 6: dots = "⡟"; break;
      case 7: dots = "⡿"; break;
    }

    let plus = (num == "fail" ? gameWon : (game.currentRowIndex == num)) ? "+" : "";
    return `${eights}${dots}${count}${plus}`;
  }

  let share = `Wordle ${puzzleNum} ${(gameWon ? guesses.length : "X")}/6${settings.hardMode ? "*" : ""}

${getBoard(guesses)}

Games: ${stats.gamesPlayed} | Streak: ${stats.currentStreak} | Max: ${stats.maxStreak}

1️⃣ ${getBar(stats.guesses, 1)}
2️⃣ ${getBar(stats.guesses, 2)}
3️⃣ ${getBar(stats.guesses, 3)}
4️⃣ ${getBar(stats.guesses, 4)}
5️⃣ ${getBar(stats.guesses, 5)}
6️⃣ ${getBar(stats.guesses, 6)}
*️⃣ ${getBar(stats.guesses, "fail")}`;

  return share;
}
