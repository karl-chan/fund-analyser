from datetime import datetime, timezone

from lib.util.date import parse_date, format_date


def test_parse_date():
    s = "2019-01-01T00:00:00Z"
    assert parse_date(s) == datetime(2019, 1, 1, tzinfo=timezone.utc)


def test_format_date():
    d = datetime(2019, 1, 1, tzinfo=timezone.utc)
    assert format_date(d) == "2019-01-01T00:00:00Z"
