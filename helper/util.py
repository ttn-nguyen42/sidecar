from contextlib import contextmanager
from datetime import datetime, timedelta
from typing import Generator
from setup import Registry
from sqlalchemy.orm import Session


@contextmanager
def get_session(registry: Registry) -> Generator[Session]:
    session = registry.get_session()
    try:
        yield session
        session.commit()
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


def datetime_from(dt: datetime, days: int) -> datetime:
    year, month, day = dt.year, dt.month, dt.day
    return datetime(year, month, day) + timedelta(days=days)

def end_of_this_week(dt: datetime) -> datetime:
    weekday = dt.weekday()
    return datetime_from(dt, 6 - weekday)

def start_of_this_week(dt: datetime) -> datetime:
    weekday = dt.weekday()
    return datetime_from(dt, -weekday)

def end_of_this_month(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month + 1, 1) - timedelta(days=1)