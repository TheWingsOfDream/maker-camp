from flask import render_template, request, jsonify

import db


def register_routes(app):
    @app.route("/")
    def index():
        return render_template("index.html")

    @app.route("/api/cards", methods=["GET"])
    def get_cards():
        return jsonify(db.load_cards())

    @app.route("/api/cards", methods=["POST"])
    def post_card():
        data = request.get_json(silent=True) or {}
        # 强制转字符串，避免 text 为数字/列表/布尔时调用 .strip() 抛 AttributeError -> 500
        text = str(data.get("text") or "").strip()
        if not text:
            return jsonify({"error": "内容不能为空"}), 400
        if len(text) > 200:
            return jsonify({"error": "内容不能超过 200 字"}), 400
        card = db.add_card(text)
        print(f"[新增] id={card['id']} text={card['text']}")
        return jsonify(card), 201

    @app.route("/api/cards/<card_id>", methods=["DELETE"])
    def delete_card(card_id):
        ok = db.delete_card(card_id)
        if not ok:
            return jsonify({"error": "没有这条卡片"}), 404
        print(f"[删除] id={card_id}")
        return jsonify({"ok": True})
