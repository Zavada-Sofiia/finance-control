from sqlmodel import SQLModel, create_engine, Session

sqlite_url = "sqlite:///finance_database.db"
# check_same_thread=False потрібен для SQLite у FastAPI
engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})

def create_db_and_tables():
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session
