from lib.util.env import is_production


# assuming test is run locally
def test_is_not_production():
    assert not is_production()
