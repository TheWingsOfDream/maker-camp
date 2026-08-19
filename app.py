from flask import Flask

import config
from routes import register_routes

app = Flask(__name__)

# 让接口返回的中文保持原样，不要被转义成 \uXXXX
app.json.ensure_ascii = False
app.json.sort_keys = False

# 注册路由
register_routes(app)

if __name__ == "__main__":
    app.run(host=config.HOST, port=config.PORT, debug=config.DEBUG)
