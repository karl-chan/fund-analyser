from client import data


def test_get():
    assert data.get("/admin/healthcheck") == {
        "charlesStanleyDirect": True,
        "testsPassing": True
    }
