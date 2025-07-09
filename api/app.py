from flask import Flask, jsonify
from flask_cors import CORS
import pandas as pd
from datautils import get_id_from_name, get_game_logs, get_season_stats, get_team_risers_and_droppers

app = Flask(__name__)
CORS(app)

CSV_PATH = "SFBB Player ID Map - PLAYERIDMAP.csv"
player_df = pd.read_csv(CSV_PATH)

@app.route("/api/mlbid/<name>")
def get_id(name):
    mlbid, full_name, team, pos = get_id_from_name(player_df, name)
    if not mlbid:
        return jsonify({"error": f"No player found with name '{name}'"}), 404
    return jsonify({"mlbid": mlbid, "player": full_name, "team": team, "position": pos})

@app.route("/api/playerlogs/<name>")
def last_10_by_name(name):
    mlbid, full_name, team, pos = get_id_from_name(player_df, name)
    if not mlbid:
        return jsonify({"error": f"No player found with name '{name}'"}), 404
    if full_name and full_name.lower() == "shohei ohtani":
        hitting_logs = get_game_logs(mlbid, "2025", pos="hitting") or []
        pitching_logs = get_game_logs(mlbid, "2025", pos="P", filter_pitching_starts=True) or []
        return jsonify({
            "mlbid": mlbid,
            "player": full_name,
            "team": team,
            "position": "P/DH",
            "hitting_logs": hitting_logs,
            "pitching_logs": pitching_logs
        })
    logs = get_game_logs(mlbid, "2025", pos or "") or []
    return jsonify({
        "player": full_name, "mlbid": mlbid, "team": team, "position": pos, "logs": logs
    })

@app.route("/api/seasonstats/<name>")
def season_by_name(name):
    mlbid, full_name, team, pos = get_id_from_name(player_df, name)
    if not mlbid:
        return jsonify({"error": f"No player found with name '{name}'"}), 404
    stats = get_season_stats(mlbid, "2025", pos or "") or {}
    return jsonify({
        "player": full_name, "mlbid": mlbid, "team": team, "position": pos, "season_stats": stats
    })

@app.route("/api/dual_seasonstats/<name>")
def dual_seasonstats(name):
    mlbid, full_name, team, pos = get_id_from_name(player_df, name)
    if not mlbid:
        return jsonify({"error": f"No player found with name '{name}'"}), 404
    if full_name and full_name.lower() == "shohei ohtani":
        hitting_stats = get_season_stats(mlbid, "2025", pos="hitting")
        pitching_stats = get_season_stats(mlbid, "2025", pos="P")
        return jsonify({
            "player": full_name,
            "mlbid": mlbid,
            "team": team,
            "position": "P/DH",
            "hitting_stats": hitting_stats or {},
            "pitching_stats": pitching_stats or {}
        })
    stats = get_season_stats(mlbid, "2025", pos or "") or {}
    return jsonify({
        "player": full_name, "mlbid": mlbid, "team": team, "position": pos, "season_stats": stats
    })

@app.route('/api/allplayers')
def all_players():
    player_names = player_df['PLAYERNAME'].dropna().unique().tolist()
    return jsonify({"players": player_names})

@app.route('/api/risersdroppers')
def risers_droppers():
    data = get_team_risers_and_droppers(n_days=20, n_games=10, top_k=10)
    return jsonify(data)

if __name__ == "__main__":
    app.run(debug=True)
