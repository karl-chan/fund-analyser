import logging
from logging import getLevelName


def _init_logger():
    from lib.util import properties
    level = getLevelName(properties.get("log.level"))
    logging.basicConfig(level=level)


_init_logger()
