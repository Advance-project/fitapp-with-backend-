"""
Start the FastAPI server.

Run from the backend/ folder:
    python run.py

Setting PYTHONPATH here ensures uvicorn's reloader subprocess on Windows
(which uses multiprocessing spawn mode) also finds the 'app' package.
"""
import os
import sys

backend_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, backend_dir)
os.environ["PYTHONPATH"] = backend_dir  # inherited by reloader subprocess

import uvicorn  # noqa: E402  (import after path setup)

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="127.0.0.1", port=8000, reload=True)
