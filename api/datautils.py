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
