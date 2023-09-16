import logging
import sys
from datetime import date, datetime

import matplotlib
import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from ffn import calc_max_drawdown
from overrides import overrides

from lib.indicators.indicator_utils import bollinger_bands
from lib.stock import stock_cache
from lib.stocksimulate.broker.stock_broker import Trading212
from lib.stocksimulate.stock_history import last_bought_date, TradeHistory
from lib.stocksimulate.stock_simulator import StockSimulator
from lib.stocksimulate.strategy.stock_strategy import Confidences, StockStrategy
from lib.util.dates import BDAY
from lib.util.lang import intersection
from lib.util.logging_utils import log_debug


class AlwaysEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        return {symbol: 1 for symbol in prices_df.columns}


class TrailingExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        threshold = 0.05  # 5%
        log_debug(f"Trailing exit for date {dt}")

        prices_df_since_bought = prices_df.copy()
        for symbol in prices_df.columns:
            bought_dt = last_bought_date(symbol, history)
            prices_df_since_bought.loc[:bought_dt, symbol] = np.nan  # type: ignore
        thresholds = prices_df_since_bought.loc[:dt, :].max() * (1 - threshold)  # type: ignore

        return prices_df.loc[dt, :].lt(thresholds).astype('int').to_dict()


class ProfitTrailingExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        profit_exit_threshold = 0.01  # 2%
        stop_loss_threshold = 0.005  # 1%
        log_debug(f"Profit trailing exit for date {dt}")

        prices_df_since_bought = prices_df.copy()
        bought_prices_df = prices_df.copy()
        for symbol in prices_df.columns:
            bought_dt = last_bought_date(symbol, history)
            prices_df_since_bought.loc[:bought_dt, symbol] = np.nan  # type: ignore

            bought_prices_df.loc[:bought_dt, symbol] = np.nan
            bought_prices_df.loc[bought_dt:, symbol] = prices_df.loc[bought_dt, symbol]

        profit_exit_thresholds = bought_prices_df.loc[dt, :] * (1 + profit_exit_threshold)
        stop_loss_thresholds = prices_df_since_bought.loc[:dt, :].max() * (1 - stop_loss_threshold)  # type: ignore

        return (
                (prices_df.loc[dt, :].ge(profit_exit_thresholds)) |
                (prices_df.loc[dt, :].lt(stop_loss_thresholds))
        ).astype('int').to_dict()


class BollingerLowEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        log_debug(f"BollingerLowEntryStrategy for date: {dt}")
        upper_band, middle_band, lower_band = bollinger_bands(prices_df, stdev=1)
        cond = prices_df.lt(lower_band) & prices_df.diff().gt(0)
        return cond.loc[dt, :].astype('int').to_dict()


class BollingerHighExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        upper_band, middle_band, lower_band = bollinger_bands(prices_df)
        return prices_df.gt(upper_band).loc[dt, :].astype('int').to_dict()


class WorstFallEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        log_debug(f"WorstFallEntryStrategy for date: {dt}")
        return prices_df.pct_change(1).loc[dt, :].nsmallest(10).lt(0).astype('int').to_dict()


class HighestRiseEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        log_debug(f"HighestRiseEntryStrategy for date: {dt}")
        return prices_df.pct_change(1).loc[dt, :].nlargest(20).gt(0).astype('int').to_dict()


class RisingEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        return prices_df.pct_change(5).gt(0.5).loc[dt, :].astype('int').to_dict()


class ContinuousRiseEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        log_debug(f"ContinuousRiseEntryStrategy for date: {dt}")
        recent_df = prices_df.loc[:dt, :]  # type: ignore
        lookback = 60
        if len(recent_df) <= lookback:
            return {}
        else:
            continuous_rise_df = recent_df.iloc[[-lookback, -10, -9, -8, -7, -6, -5, -4, -3, -2, -1], :].diff().iloc[1:,
                                 :].gt(
                0).all()
            continuous_rise_symbols = continuous_rise_df[continuous_rise_df].index
            return prices_df.pct_change(lookback).loc[dt, continuous_rise_symbols].nlargest(10).gt(0).astype(
                'int').to_dict()


class AbsRisingEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        window = prices_df.loc[dt - 2 * BDAY: dt, :]  # type: ignore
        pct_change = (window.iloc[-1] - window.iloc[0]) / window.iloc[0]
        return pct_change.gt(0).astype('int').to_dict()


class AboveMaxEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        max_prices_df = prices_df.loc[:dt, :].max()  # type: ignore
        return prices_df.loc[dt, :].eq(max_prices_df).astype('int').to_dict()


class BelowMaxExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        max_prices_df = prices_df.loc[:dt, :].max()  # type: ignore
        return prices_df.loc[dt, :].lt(max_prices_df).astype('int').to_dict()


class AbsFallingExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        window = prices_df.loc[dt - BDAY: dt, :]  # type: ignore
        pct_change = (window.iloc[-1] - window.iloc[0]) / window.iloc[0]
        return pct_change.lt(0).astype('int').to_dict()


class HoldingDaysExitStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        hold_days = 1  # business days
        confidences: Confidences = {}
        for symbol in prices_df.columns:
            bought_dt = last_bought_date(symbol, history)
            if bought_dt + hold_days * BDAY <= dt:
                confidences[symbol] = 1
            else:
                confidences[symbol] = 0
        return confidences


def _describe_and_plot(account: pd.DataFrame) -> None:
    # set display mode and suppress useless warnings
    # noinspection PyUnresolvedReferences
    matplotlib.use("Qt5Agg" if sys.platform == "darwin" else "TkAgg")
    logging.getLogger("matplotlib.font_manager").setLevel(logging.INFO)

    balance = account["value"]
    print(f"Account:\n{account.to_string()}")
    print(f"Max drawdown: {calc_max_drawdown(balance)}")
    balance.plot()
    plt.show()


if __name__ == "__main__":
    sp500_symbols = ["AAPL", "MSFT", "AMZN", "GOOGL", "BRK.B", "TSLA", "NVDA", "GOOG", "UNH", "XOM", "JNJ", "JPM",
                     "META", "V", "PG", "HD", "MA", "CVX", "MRK", "ABBV", "LLY", "PEP", "BAC", "PFE", "KO", "AVGO",
                     "COST", "TMO", "WMT", "CSCO", "MCD", "DIS", "ABT", "WFC", "ACN", "VZ", "CMCSA", "DHR", "CRM",
                     "LIN", "ADBE", "TXN", "PM", "BMY", "NKE", "NFLX", "RTX", "NEE", "QCOM", "T", "ORCL", "HON", "COP",
                     "UPS", "MS", "AMGN", "LOW", "CAT", "AMD", "GS", "SCHW", "SBUX", "IBM", "UNP", "DE", "ELV", "SPGI",
                     "BA", "CVS", "INTU", "PLD", "MDT", "LMT", "INTC", "GILD", "AXP", "BLK", "C", "ADI", "AMAT", "BKNG",
                     "AMT", "ADP", "GE", "MDLZ", "TJX", "CI", "NOW", "TMUS", "SYK", "CB", "PYPL", "MO", "PGR", "ISRG",
                     "MMC", "REGN", "ZTS", "TGT", "VRTX", "DUK", "SLB", "FISV", "SO", "NOC", "EOG", "BDX", "ETN", "CME",
                     "BSX", "ITW", "LRCX", "EQIX", "USB", "HUM", "AON", "CSX", "PNC", "TFC", "CL", "MU", "APD", "MMM",
                     "FCX", "CCI", "GM", "ICE", "MPC", "EL", "WM", "ATVI", "HCA", "SNPS", "KLAC", "CDNS", "ORLY", "GD",
                     "SHW", "MRNA", "MCK", "NSC", "DG", "VLO", "PXD", "SRE", "AZO", "FDX", "EMR", "F", "D", "GIS",
                     "PSX", "MET", "ADSK", "AEP", "EW", "NXPI", "MCO", "PSA", "APH", "MAR", "AIG", "ADM", "ROP", "CTVA",
                     "TRV", "PH", "MSI", "MCHP", "DXCM", "KMB", "CMG", "JCI", "NUE", "OXY", "A", "MSCI", "TT", "COF",
                     "EXC", "CNC", "CHTR", "O", "DOW", "LHX", "TEL", "FIS", "IDXX", "BIIB", "SYY", "HLT", "SPG", "FTNT",
                     "ROST", "MNST", "IQV", "AFL", "ECL", "AJG", "PCAR", "TDG", "WMB", "CTAS", "HES", "BK", "YUM",
                     "AMP", "CARR", "XEL", "PRU", "DD", "STZ", "ALL", "WELL", "PAYX", "HSY", "CMI", "DVN", "NEM",
                     "OTIS", "KMI", "ON", "WBD", "CTSH", "ANET", "ROK", "ED", "MTD", "AME", "HAL", "STT", "VICI",
                     "ILMN", "GPN", "APTV", "KHC", "RMD", "ODFL", "URI", "DLR", "PEG", "DLTR", "BKR", "KDP", "PPG",
                     "DFS", "CPRT", "GWW", "OKE", "EA", "CSGP", "FAST", "KR", "ALB", "WEC", "DHI", "KEYS", "SBAC",
                     "ULTA", "CBRE", "ENPH", "CDW", "VRSK", "ES", "MTB", "AWK", "RSG", "HPQ", "IT", "EBAY", "GEHC",
                     "GLW", "ZBH", "ABC", "WTW", "WBA", "TSCO", "CEG", "EIX", "TROW", "EFX", "ACGL", "PCG", "HIG",
                     "AVB", "FITB", "GPC", "LEN", "FANG", "IFF", "LYB", "VMC", "FTV", "DAL", "ARE", "IR", "ANSS", "WY",
                     "FRC", "WST", "MLM", "AEE", "ALGN", "LH", "ETR", "RF", "EQR", "DTE", "FE", "MPWR", "HBAN", "RJF",
                     "DOV", "PWR", "BAX", "CFG", "EXR", "PFG", "CAH", "HPE", "PPL", "CHD", "HOLX", "STLD", "LUV", "TDY",
                     "CINF", "VTR", "NTRS", "NDAQ", "WAT", "MKC", "VRSN", "WAB", "LVS", "OMC", "MAA", "CLX", "INVH",
                     "CTRA", "STE", "XYL", "DRI", "BALL", "TSN", "CNP", "EPAM", "SWKS", "K", "CMS", "TTWO", "MOS",
                     "CAG", "EXPD", "MOH", "TRGP", "CF", "IEX", "BR", "KEY", "BBY", "DGX", "AMCR", "AES", "SIVB", "COO",
                     "SEDG", "FSLR", "FMC", "ETSY", "PKI", "EXPE", "ATO", "SYF", "SJM", "MRO", "UAL", "FDS", "TER",
                     "ZBRA", "FLT", "RCL", "TXT", "NVR", "HWM", "J", "JBHT", "GRMN", "RE", "AVY", "ESS", "LKQ", "INCY",
                     "NTAP", "PAYC", "IRM", "LW", "IPG", "POOL", "MGM", "TYL", "EVRG", "VTRS", "LDOS", "WRB", "CBOE",
                     "UDR", "PTC", "PEAK", "MKTX", "TRMB", "LNT", "HRL", "IP", "BRO", "SNA", "STX", "PKG", "SWK", "DPZ",
                     "KIM", "CPT", "CHRW", "APA", "MTCH", "WDC", "PHM", "AKAM", "JKHY", "CTLT", "HST", "MAS", "NDSN",
                     "BWA", "GEN", "L", "BF.B", "PARA", "EQT", "CZR", "TECH", "CDAY", "CE", "HSIC", "WYNN", "KMX",
                     "FOXA", "NI", "TFX", "GL", "CRL", "TPR", "CCL", "CPB", "LYV", "QRVO", "EMN", "BIO", "JNPR", "ALLE",
                     "AAL", "TAP", "UHS", "BXP", "BBWI", "REG", "CMA", "PNR", "RHI", "HII", "AAP", "FFIV", "AOS", "PNW",
                     "ROL", "BEN", "VFC", "WRK", "IVZ", "NRG", "FRT", "WHR", "XRAY", "ZION", "GNRC", "HAS", "SBNY",
                     "SEE", "NCLH", "AIZ", "NWSA", "OGN", "DXC", "ALK", "MHK", "NWL", "RL", "LNC", "FOX", "DVA", "LUMN",
                     "DISH", "NWS"]
    prices_df, volume_df = stock_cache.get_prices(symbols=None)
    symbols = intersection(prices_df.columns, sp500_symbols)

    start_date = datetime(2021, 1, 4)
    stock_simulator = StockSimulator(
        symbols=symbols,
        entry_strategy=WorstFallEntryStrategy(),  # AboveMaxEntryStrategy(),  # BollingerLowEntryStrategy(),
        exit_strategy=ProfitTrailingExitStrategy(),
        broker=Trading212()
    )
    account, history = stock_simulator.run(start_date=start_date)
    balance = account["value"]
    stocks_adjusted = prices_df.loc[
                      start_date:, symbols  # type: ignore
                      ] / prices_df.loc[
                          start_date:start_date, symbols  # type: ignore
                          ].squeeze() * balance.at[start_date]

_describe_and_plot(account)
# pd.concat([stocks_adjusted, balance], axis=1).plot()
