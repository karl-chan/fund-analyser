from lib.simulate.simulator import Simulator
from lib.simulate.strategy.strategy import SelectAll
from lib.simulate.tiebreaker.no_op_tie_breaker import NoOpTieBreaker
from lib.util.dates import BDAY

if __name__ == "__main__":
    simulator = Simulator(
        strategy=SelectAll(),
        tie_breaker=NoOpTieBreaker(),
        buy_sell_gap=0 * BDAY,
        isins=[
            "GB00B1XFGM25",
            "GB00B4TZHH95",
            "GB00B8JYLC77",
            "GB00B39RMM81",
            "GB00B80QG615",
            "GB00B99C0657",
            # "GB00BH57C751",
            "GB0006061963",
            # "IE00B4WL8048",
            "IE00B90P3080",
            "LU0827884411",
        ]
    )
    results = simulator.run()
    Simulator.describe_and_plot(results)
