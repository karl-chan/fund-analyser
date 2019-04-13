from client import data


def test_get():
    assert data.get("/api/admin/healthcheck") == {"charlesStanleyDirect": True}
