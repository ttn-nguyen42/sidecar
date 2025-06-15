from contextlib import contextmanager
from setup import Registry
from sqlalchemy.orm import Session


@contextmanager
def get_session(registry: Registry) -> Session:
    session = registry.get_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()
