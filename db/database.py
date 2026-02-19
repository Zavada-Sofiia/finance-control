"""
Finance Control DataBase
"""
from sqlmodel import SQLModel, create_engine, Session

SQLITE_URL = "sqlite:///finance_database.db"

engine = create_engine(SQLITE_URL, connect_args={"check_same_thread": False})

def create_db_and_tables():
    """
    Create the database and tables defined in the SQLModel metadata.
    This function initializes the SQLite database specified
    by the `sqlite_url` and creates all tables defined
    in the SQLModel classes.
    It should be called once to set up the database schema
    before performing any database operations.
    Example:
        create_db_and_tables()
    """
    SQLModel.metadata.create_all(engine)

def get_session():
    """
    Create a new database session.
    This function provides a context manager for creating a new
    session with the database engine.
    It yields a session object that can be used for querying and modifying
    the database. The session is automatically closed when the context is exited.
    Yields:
        Session: A SQLModel Session object for interacting with the database.
    Example:
        with get_session() as session:s
        Perform database operations
    """
    with Session(engine) as session:
        yield session
