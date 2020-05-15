import inspect
import logging


def log_critical(*args, **kwargs):
    _get_logger().critical(*args, **kwargs)


def log_debug(*args, **kwargs):
    _get_logger().debug(*args, **kwargs)


def log_error(*args, **kwargs):
    _get_logger().error(*args, **kwargs)


def log_info(*args, **kwargs):
    _get_logger().info(*args, **kwargs)


def log_warning(*args, **kwargs):
    _get_logger().warning(*args, **kwargs)


def _get_logger():
    frm = inspect.stack(context=0)[2]
    mod = inspect.getmodule(frm[0])
    return logging.getLogger(mod.__name__)
