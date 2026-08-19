import os

# 项目根目录：即 config.py 所在的目录
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# 数据文件路径：data/cards.json
DATA_FILE = os.path.join(BASE_DIR, "data", "cards.json")

# 服务器配置
HOST = "0.0.0.0"
PORT = 5001
# 生产/对外暴露时务必关闭 debug：开启会让 Werkzeug 交互式调试器暴露在 0.0.0.0，
# 任何人都能通过它执行任意代码（RCE）。仅在可信的本地开发环境临时开启。
DEBUG = False
