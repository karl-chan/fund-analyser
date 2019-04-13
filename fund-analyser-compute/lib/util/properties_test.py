from lib.util import properties


def test_get_missing_property():
    assert properties.get("missing.property") is None


def test_get_from_environment():
    sys_path = properties.get("PATH")
    assert isinstance(sys_path, str)
    assert sys_path


def test_get_from_file():
    assert properties.get("heroku.app.name") == "fund-analyzer-compute"


def test_parse_json():
    assert properties.get("fund.lookbacks") == [
        "5Y", "3Y", "1Y", "6M", "3M", "1M", "2W", "1W", "3D", "1D"]
