import json
import logging

from requests import Session

from services.models import Config
from setup import Registry, registry

logger = logging.getLogger(__name__)


class ConfigService():
    def __init__(self, registry: Registry):
        self.registry = registry
        return

    def get(self, key: str) -> Config:
        if not ConfigKey.include(key):
            raise ValueError(f"Invalid config key: {key}")
        with self.registry.get_session() as session:
            return self._get(session, key)

    def _get(self, session: Session, key: str) -> Config:
        return session.query(Config) \
            .filter(Config.key == key) \
            .first()

    def set(self, key: str, value: str):
        if not ConfigKey.include(key):
            raise ValueError(f"Invalid config key: {key}")
        with self.registry.get_session() as session:
            config = self._get(session, key)
            if config is None:
                config = Config.build(key, value)
                session.add(config)
            else:
                config.set_value(value)
            session.commit()

    def set_json(self, key: str, value: dict[str, any]):
        if not ConfigKey.include(key):
            raise ValueError(f"Invalid config key: {key}")
        with self.registry.get_session() as session:
            config = self._get(session, key)
            if config is None:
                config = Config.build(key, json.dumps(value))
                session.add(config)
            else:
                config.set_value(json.dumps(value))
            session.commit()

    def list(self) -> list[Config]:
        with self.registry.get_session() as session:
            return session.query(Config) \
                .order_by(Config.key) \
                .all()

    def unset(self, key: str):
        if not ConfigKey.include(key):
            raise ValueError(f"Invalid config key: {key}")
        with self.registry.get_session() as session:
            config = self._get(session, key)
            if config is not None:
                session.delete(config)
            session.commit()


class ConfigKey:
    DEFAULT_AUDIO_DEVICE_NAME = "default_audio_device_name"

    def list(self) -> list[str]:
        return [k for k in dir(ConfigKey) if not k.startswith("_")]

    def include(self, key: str) -> bool:
        return key in self.list()


config_service = ConfigService(registry)