import os


def is_production():
    return "DYNO" in os.environ  # assuming heroku is production
