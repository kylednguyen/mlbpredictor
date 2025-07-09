import requests

def get_id_from_name(player_df, name):
    name = name.strip().lower()
    match = player_df[player_df["PLAYERNAME"].str.lower() == name]
    if match.empty:
        return None, None, None, None
    row = match.iloc[0]
    mlbid = int(row["MLBID"])
    full_name = row["PLAYERNAME"]
    # Handle various possible column names for team and position
    team = row.get("TEAM", row.get("Team", ""))
    pos = row.get("POS", row.get("Position", ""))
    if full_name.lower() == "shohei ohtani":
        pos = "P/DH"
    return mlbid, full_name, team, pos

def get_game_logs(mlbid, season="2025", pos='hitting', filter_pitching_starts=False):
    if pos == 'P' or (isinstance(pos, str) and pos.startswith('P')):
        url = f"https://statsapi.mlb.com/api/v1/people/{mlbid}/stats?stats=gameLog&season={season}&group=pitching"
    else:
        url = f"https://statsapi.mlb.com/api/v1/people/{mlbid}/stats?stats=gameLog&season={season}&group=hitting"
    try:
        splits = requests.get(url).json()["stats"][0]["splits"]
    except Exception:
        return []
    logs = []
    for g in splits:
        stat = g["stat"]
        if pos == 'P' or (isinstance(pos, str) and pos.startswith('P')):
            if filter_pitching_starts and stat.get('gamesStarted', 0) != 1:
                continue
            logs.append({
                "Date": g.get("date", ""),
                "Opponent": g.get("opponent", {}).get("name", "Unknown"),
                "IP": stat.get("inningsPitched", 0),
                "H": stat.get("hits", 0),
                "ER": stat.get("earnedRuns", 0),
                "BB": stat.get("baseOnBalls", 0),
                "SO": stat.get("strikeOuts", 0),
                "W": stat.get("wins", 0),
                "L": stat.get("losses", 0),
                "SV": stat.get("saves", 0),
                "HR": stat.get("homeRuns", 0),
                "ERA": stat.get("era", 0),
                "GS": stat.get("gamesStarted", 0),
            })
        else:
            h = stat.get("hits", 0)
            doubles = stat.get("doubles", 0)
            triples = stat.get("triples", 0)
            hr = stat.get("homeRuns", 0)
            singles = h - doubles - triples - hr
            total_bases = singles + 2 * doubles + 3 * triples + 4 * hr
            logs.append({
                "Date": g.get("date", ""),
                "Opponent": g.get("opponent", {}).get("name", "Unknown"),
                "AB": stat.get("atBats", 0),
                "R": stat.get("runs", 0),
                "H": h,
                "HR": hr,
                "RBI": stat.get("rbi", 0),
                "BB": stat.get("baseOnBalls", 0),
                "SO": stat.get("strikeOuts", 0),
                "TOTAL_BASES": total_bases
            })
    logs.sort(key=lambda x: x["Date"], reverse=True)
    return logs[:10][::-1]

def get_season_stats(mlbid, season="2025", pos="hitting"):
    if pos == 'P' or (isinstance(pos, str) and pos.startswith('P')):
        url = f"https://statsapi.mlb.com/api/v1/people/{mlbid}/stats?stats=season&season={season}&group=pitching"
    else:
        url = f"https://statsapi.mlb.com/api/v1/people/{mlbid}/stats?stats=season&season={season}&group=hitting"
    try:
        return requests.get(url).json()["stats"][0]["splits"][0]["stat"]
    except Exception:
        return {}

def get_career_stats(mlbid, pos="hitting"):
    if pos == 'P' or (isinstance(pos, str) and pos.startswith('P')):
        url = f"https://statsapi.mlb.com/api/v1/people/{mlbid}/stats?stats=career&group=pitching"
    else:
        url = f"https://statsapi.mlb.com/api/v1/people/{mlbid}/stats?stats=career&group=hitting"
    try:
        return requests.get(url).json()["stats"][0]["splits"][0]["stat"]
    except Exception:
        return {}
import requests
from datetime import datetime, timedelta
from collections import defaultdict

def get_team_risers_and_droppers(n_days=20, n_games=10, top_k=10):
    """Returns dict with risers and droppers for MLB teams."""
    # Fetch last n_days of games
    all_games = []
    today = datetime.now()
    for i in range(n_days):
        date = (today - timedelta(days=i)).strftime("%m/%d/%Y")
        url = f"https://statsapi.mlb.com/api/v1/schedule/games/?sportId=1&date={date}"
        resp = requests.get(url)
        data = resp.json()
        for date_obj in data.get("dates", []):
            for game in date_obj.get("games", []):
                all_games.append(game)
    # Build logs for each team
    team_logs = defaultdict(list)
    for game in all_games:
        status = game.get("status", {}).get("detailedState", "")
        if status not in ["Final", "Game Over"]:
            continue
        teams = game["teams"]
        home_team = teams["home"]["team"]
        away_team = teams["away"]["team"]
        home_win = teams["home"]["isWinner"]
        away_win = teams["away"]["isWinner"]
        date = game["gameDate"][:10]
        team_logs[home_team["id"]].append({
            "team": home_team["name"],
            "abbreviation": home_team.get("abbreviation", ""),
            "date": date,
            "win": home_win,
        })
        team_logs[away_team["id"]].append({
            "team": away_team["name"],
            "abbreviation": away_team.get("abbreviation", ""),
            "date": date,
            "win": away_win,
        })
    # Compute last n_games records
    records = []
    for team_id, games in team_logs.items():
        games = sorted(games, key=lambda x: x["date"], reverse=True)[:n_games]
        if len(games) < n_games:
            continue
        wins = sum(1 for g in games if g["win"])
        losses = n_games - wins
        win_pct = wins / n_games
        records.append({
            "team": games[0]["team"],
            "abbreviation": games[0].get("abbreviation", ""),
            "wins": wins,
            "losses": losses,
            "win_pct": round(win_pct, 3)
        })
    risers = sorted(records, key=lambda x: x["win_pct"], reverse=True)[:top_k]
    droppers = sorted(records, key=lambda x: x["win_pct"])[:top_k]
    return {"risers": risers, "droppers": droppers}
