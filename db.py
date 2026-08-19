import os
import json
import time
import tempfile
import random
import string
import threading
from datetime import datetime

import config

# 写操作锁：保证「读→改→写」原子性，避免并发覆盖丢数据
_write_lock = threading.Lock()


def _ensure_data_dir():
    """确保 data 目录存在（data/cards.json 所在目录）。"""
    os.makedirs(os.path.dirname(config.DATA_FILE), exist_ok=True)


def load_cards():
    """读取 data/cards.json，返回列表；文件不存在就先创建成空列表 []。

    Windows 下文件可能正被并发写方的 os.replace 占用，open 会短暂报 OSError，
    这里重试几次即可（原子改名保证读到的永远是完整文件，不会是半截 JSON）。
    """
    _ensure_data_dir()
    if not os.path.exists(config.DATA_FILE):
        with open(config.DATA_FILE, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False)
        return []
    for attempt in range(50):
        try:
            with open(config.DATA_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except OSError:
            if attempt == 49:
                raise
            time.sleep(0.005)


def save_cards(cards):
    """把列表写回 data/cards.json（中文保持原样）。

    先写同目录临时文件，再 os.replace 原子改名：读操作要么看到完整的旧文件、
    要么看到完整的新文件，永远不会读到写到一半的半截 JSON（否则并发 GET 会 500 / 数据损坏）。

    Windows 上若目标文件正被其他读线程打开，os.replace 可能短暂报 PermissionError，
    这里做有限次重试即可（读方会很快释放文件句柄）。
    """
    _ensure_data_dir()
    dir_name = os.path.dirname(config.DATA_FILE)
    fd, tmp_path = tempfile.mkstemp(dir=dir_name, prefix=".cards_", suffix=".tmp")
    try:
        with os.fdopen(fd, "w", encoding="utf-8") as f:
            json.dump(cards, f, ensure_ascii=False, indent=2)
            f.flush()
            os.fsync(f.fileno())
        for attempt in range(100):
            try:
                os.replace(tmp_path, config.DATA_FILE)
                return
            except PermissionError:
                if attempt == 99:
                    raise
                time.sleep(0.005)
    except BaseException:
        if os.path.exists(tmp_path):
            try:
                os.remove(tmp_path)
            except OSError:
                pass
        raise


def add_card(text):
    """新增一条卡片：8 位随机 id、text、created_at(年-月-日 时:分)，新的排在最前面，返回这条卡片。"""
    card = {
        "id": "".join(random.choices(string.ascii_letters + string.digits, k=8)),
        "text": text,
        "created_at": datetime.now().strftime("%Y-%m-%d %H:%M"),
    }
    with _write_lock:
        cards = load_cards()
        cards.insert(0, card)
        save_cards(cards)
    return card


def delete_card(card_id):
    """按 id 删除卡片，删掉返回 True，没找到返回 False。"""
    with _write_lock:
        cards = load_cards()
        for i, c in enumerate(cards):
            if c.get("id") == card_id:
                del cards[i]
                save_cards(cards)
                return True
    return False
