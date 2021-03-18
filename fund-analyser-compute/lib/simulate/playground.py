from lib.simulate.simulator import Simulator
from lib.simulate.strategy.bollinger_returns import BollingerReturns

if __name__ == "__main__":
    simulator = Simulator(
        strategy=BollingerReturns(),
        isins=[
            "GB00B1XFGM25",
            "GB00B4TZHH95",
            "GB00B8JYLC77",
            # "GB00B39RMM81",
            "GB00B80QG615",
            "GB00B99C0657",
            # "GB00BH57C751",
            "GB0006061963",
            # "IE00B4WL8048",
            "IE00B90P3080",
            "LU0827884411",
        ]
    )

    # simulator = Simulator(
    #     strategy=MaxHistoricReturns()
    # )

    results = simulator.run()
    Simulator.describe_and_plot(results)
