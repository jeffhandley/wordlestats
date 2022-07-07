function setWordleStats(currentStreak, maxStreak, guesses1, guesses2, guesses3, guesses4, guesses5, guesses6, losses, winPercentage, gamesPlayed, gamesWon, averageGuesses) {
    let data = JSON.parse(localStorage.getItem("nyt-wordle-moogle/ANON")) || {};
    let {stats} = data;

    stats = {
        ...stats,
        currentStreak,
        maxStreak,
        guesses: {
            ...stats.guesses || {},
            "1": guesses1,
            "2": guesses2,
            "3": guesses3,
            "4": guesses4,
            "5": guesses5,
            "6": guesses6,
            "fail": losses
        },
        winPercentage,
        gamesPlayed,
        gamesWon,
        averageGuesses
    };

    data = {
        ...data,
        stats
    };

    localStorage.setItem("nyt-wordle-moogle/ANON", JSON.stringify(anon));
    completion(stats);
}
