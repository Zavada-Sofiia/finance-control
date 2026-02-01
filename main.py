import os
from fastapi import FastAPI, Request

app = FastAPI()

@app.get("/")
async def root(request: Request):
    # You can use 'request' to see client info, like their IP address
    return "Finance Control"

@app.get("/config")
def get_config():
    # Using the 'os' import to grab an environment variable
    db_url = os.getenv("DATABASE_URL", "sqlite:///./test.db")
    return {"database": db_url}
