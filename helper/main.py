from api import run_api
from config import read_config
from log import setup_logger


def main():
    configs = read_config()
    setup_logger(configs=configs)
    run_api(configs=configs)


if __name__ == "__main__":
    main()
