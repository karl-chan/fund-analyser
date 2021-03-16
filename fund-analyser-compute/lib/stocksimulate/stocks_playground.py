# noinspection PyUnresolvedReferences
import _tkinter
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
            prices_df_since_bought.loc[:bought_dt, :] = np.nan  # type: ignore
        thresholds = prices_df_since_bought.loc[:dt, :].max() * (1 - threshold)  # type: ignore

        return prices_df.loc[dt, :].lt(thresholds).astype('int').to_dict()


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
        log_debug(f"HighestRisingEntryStrategy for date: {dt}")
        return prices_df.pct_change(20).loc[dt, :].nsmallest(10).lt(0).astype('int').to_dict()


class HighestRiseEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        log_debug(f"HighestRiseEntryStrategy for date: {dt}")
        return prices_df.pct_change(1).loc[dt, :].nlargest(1).gt(0).astype('int').to_dict()


class RisingEntryStrategy(StockStrategy):
    @overrides
    def should_execute(self, dt: date, prices_df: pd.DataFrame, history: TradeHistory) -> Confidences:
        return prices_df.pct_change(5).gt(0.5).loc[dt, :].astype('int').to_dict()


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
        return pct_change.lt(0.03).astype('int').to_dict()


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
    matplotlib.use("Qt5Agg" if sys.platform == "darwin" else "TkAgg")
    logging.getLogger("matplotlib.font_manager").setLevel(logging.INFO)

    balance = account["value"]
    print(f"Account:\n{account.to_string()}")
    print(f"Max drawdown: {calc_max_drawdown(balance)}")
    balance.plot()
    plt.show()


if __name__ == "__main__":
    trading212_symbols = ["AACQ", "AAL", "AAME", "AAOI", "AAON", "AAPL", "AAWW", "ABCB", "ABCL", "ABCM", "ABEO", "ABIO",
                          "ABMD",
                          "ABNB", "ABTX", "ABUS", "ACAC", "ACAD", "ACBI", "ACCD", "ACER", "ACET", "ACEV", "ACHC",
                          "ACHV", "ACIA",
                          "ACIU", "ACIW", "ACLS", "ACMR", "ACNB", "ACOR", "ACRS", "ACRX", "ACST", "ACTC", "ACTG",
                          "ADBE", "ADES",
                          "ADI", "ADIL", "ADMA", "ADMP", "ADMS", "ADN", "ADOC", "ADPT", "ADSK", "ADTN", "ADTX", "ADUS",
                          "ADV",
                          "ADVM", "ADXN", "ADXS", "AEGN", "AEHL", "AEHR", "AEI", "AEIS", "AEMD", "AERI", "AESE", "AEY",
                          "AEYE",
                          "AEZS", "AFBI", "AFCG", "AFIB", "AFIN", "AFMD", "AFRM", "AFYA", "AGBA", "AGC", "AGEN", "AGFS",
                          "AGFY",
                          "AGIO", "AGLE", "AGMH", "AGNC", "AGRX", "AGTC", "AGYS", "AHAC", "AHCO", "AHPI", "AIHS",
                          "AIKI", "AIMC",
                          "AINV", "AIRG", "AIRT", "AKAM", "AKBA", "AKER", "AKRO", "AKTS", "AKUS", "ALAC", "ALBO",
                          "ALCO", "ALDX",
                          "ALEC", "ALGM", "ALGN", "ALGS", "ALGT", "ALIM", "ALJJ", "ALKS", "ALLK", "ALLO", "ALLT",
                          "ALNA", "ALNY",
                          "ALOT", "ALPN", "ALRM", "ALRN", "ALRS", "ALSK", "ALT", "ALTA", "ALTM", "ALTO", "ALTR", "ALTU",
                          "ALVR",
                          "ALXN", "ALXO", "AMAL", "AMAT", "AMBA", "AMCX", "AMD", "AMED", "AMEH", "AMGN", "AMHC", "AMKR",
                          "AMNB",
                          "AMOT", "AMPH", "AMRB", "AMRK", "AMRS", "AMSC", "AMSF", "AMST", "AMSWA", "AMTB", "AMTBB",
                          "AMTI", "AMTX",
                          "AMWD", "AMYT", "AMZN", "ANAB", "ANAT", "ANDA", "ANDE", "ANGI", "ANGN", "ANGO", "ANIK",
                          "ANIP", "ANIX",
                          "ANNX", "ANSS", "ANY", "AOSL", "AOUT", "APDN", "APEI", "APEN", "APLS", "APLT", "APM", "APOG",
                          "APPF",
                          "APPH", "APPN", "APR", "APRE", "APTO", "APTX", "APVO", "APWC", "APXT", "APYX", "AQB", "AQMS",
                          "AQST",
                          "ARAV", "ARAY", "ARBG", "ARCB", "ARCC", "ARCE", "ARCT", "ARDS", "ARDX", "AREC", "ARKO",
                          "ARKR", "ARLP",
                          "ARNA", "AROW", "ARPO", "ARQT", "ARRY", "ARTL", "ARTNA", "ARTW", "ARVN", "ARWR", "ARYA",
                          "ASFI", "ASLE",
                          "ASMB", "ASML", "ASO", "ASPI", "ASPS", "ASPU", "ASRT", "ASRV", "ASTC", "ASTE", "ASUR", "ASYS",
                          "ATCX",
                          "ATEC", "ATEX", "ATHA", "ATHE", "ATHX", "ATIF", "ATLC", "ATLO", "ATNF", "ATNI", "ATNX",
                          "ATOM", "ATOS",
                          "ATRA", "ATRC", "ATRI", "ATRO", "ATRS", "ATSG", "ATTO", "ATVI", "ATXI", "AUB", "AUBN", "AUDC",
                          "AUPH",
                          "AUTO", "AUVI", "AVAV", "AVCO", "AVCT", "AVEO", "AVGO", "AVGR", "AVID", "AVIR", "AVNW", "AVO",
                          "AVRO",
                          "AVT", "AVXL", "AWH", "AWRE", "AXAS", "AXDX", "AXGN", "AXLA", "AXNX", "AXON", "AXSM", "AXTI",
                          "AY",
                          "AYLA", "AYRO", "AYTU", "AZPN", "AZRX", "AZYO", "BAND", "BANF", "BANR", "BANX", "BAOS",
                          "BASI", "BBBY",
                          "BBCP", "BBGI", "BBI", "BBIG", "BBIO", "BBQ", "BBSI", "BCAB", "BCBP", "BCDA", "BCEL", "BCLI",
                          "BCML",
                          "BCOR", "BCOV", "BCOW", "BCPC", "BCRX", "BCTG", "BCYP", "BDSI", "BDSX", "BDTX", "BEAM",
                          "BEAT", "BECN",
                          "BEEM", "BELFA", "BELFB", "BFC", "BFI", "BFIN", "BFRA", "BFST", "BGCP", "BGFV", "BGNE",
                          "BHAT", "BHF",
                          "BHSE", "BHTG", "BIGC", "BIIB", "BIMI", "BIOC", "BIOL", "BIVI", "BJRI", "BKCC", "BKNG",
                          "BKSC", "BKYI",
                          "BL", "BLBD", "BLCM", "BLDP", "BLDR", "BLFS", "BLI", "BLIN", "BLKB", "BLMN", "BLNK", "BLPH",
                          "BLSA",
                          "BLUE", "BLUW", "BMBL", "BMRA", "BMRC", "BMRN", "BMTC", "BNFT", "BNGO", "BNSO", "BNTC",
                          "BNTX", "BOCH",
                          "BOKF", "BOLT", "BOMN", "BOOM", "BOSC", "BOTJ", "BOWX", "BOXL", "BPFH", "BPMC", "BPOP",
                          "BPRN", "BPTH",
                          "BPY", "BPYU", "BREW", "BREZ", "BRID", "BRKL", "BRKR", "BRKS", "BRLI", "BRLIU", "BROG", "BRP",
                          "BRPA",
                          "BRQS", "BRY", "BSBK", "BSET", "BSGM", "BSPE", "BSQR", "BSRR", "BSVN", "BSY", "BTAI", "BTAQ",
                          "BTBT",
                          "BTNB", "BTRS", "BTWN", "BUSE", "BVS", "BWAC", "BWB", "BWEN", "BWFG", "BWMX", "BXRX", "BYFC",
                          "BYND",
                          "BYSI", "CAAS", "CABA", "CAC", "CACC", "CAKE", "CALA", "CALB", "CALM", "CALT", "CALX", "CAMP",
                          "CAMT",
                          "CAPA", "CAPR", "CAR", "CARE", "CARG", "CARV", "CASA", "CASH", "CASI", "CASS", "CASY", "CATB",
                          "CATC",
                          "CATM", "CATY", "CBAN", "CBAT", "CBAY", "CBFV", "CBIO", "CBLI", "CBMB", "CBMG", "CBNK",
                          "CBPO", "CBRL",
                          "CBSH", "CBTX", "CCAP", "CCB", "CCBG", "CCCC", "CCMP", "CCNC", "CCNE", "CCOI", "CCRC", "CCRN",
                          "CCXI",
                          "CDAK", "CDEV", "CDK", "CDLX", "CDMO", "CDNA", "CDNS", "CDTX", "CDW", "CDXC", "CDXS", "CDZI",
                          "CECE",
                          "CELC", "CELH", "CEMI", "CENT", "CENTA", "CENX", "CERC", "CERE", "CERN", "CERS", "CERT",
                          "CETX", "CEVA",
                          "CFAC", "CFB", "CFBK", "CFFI", "CFFN", "CFII", "CFMS", "CFRX", "CG", "CGBD", "CGC", "CGEM",
                          "CGEN",
                          "CGIX", "CGNX", "CGRO", "CHCI", "CHCO", "CHDN", "CHEF", "CHEK", "CHFS", "CHKP", "CHMA",
                          "CHMG", "CHNG",
                          "CHNR", "CHPM", "CHRS", "CHRW", "CHTR", "CHUY", "CIDM", "CIIC", "CINF", "CIVB", "CIZN",
                          "CJJD", "CKPT",
                          "CLAR", "CLBK", "CLBS", "CLCT", "CLDB", "CLDX", "CLEU", "CLFD", "CLIR", "CLLS", "CLNE",
                          "CLNN", "CLOV",
                          "CLPS", "CLPT", "CLRB", "CLRO", "CLSD", "CLSK", "CLSN", "CLVR", "CLVS", "CLWT", "CLXT",
                          "CMBM", "CMCO",
                          "CMCSA", "CME", "CMLF", "CMLS", "CMPI", "CMPR", "CMRX", "CMTL", "CNBKA", "CNCE", "CNDT",
                          "CNET", "CNEY",
                          "CNFR", "CNNB", "CNOB", "CNSL", "CNSP", "CNST", "CNTG", "CNTY", "CNXN", "COCP", "CODA",
                          "CODX", "COFS",
                          "COGT", "COHR", "COHU", "COKE", "COLB", "COLL", "COLM", "COMM", "COMS", "CONE", "CONN",
                          "CONX", "COOP",
                          "CORE", "CORT", "COST", "COUP", "COWN", "CPAH", "CPHC", "CPIX", "CPRT", "CPRX", "CPSH",
                          "CPSI", "CPSS",
                          "CPST", "CPTA", "CRAI", "CRBP", "CRDF", "CREE", "CREG", "CRESY", "CREX", "CRIS", "CRMD",
                          "CRMT", "CRNC",
                          "CRNT", "CRNX", "CRON", "CROX", "CRSA", "CRSP", "CRSR", "CRTD", "CRTX", "CRUS", "CRVL",
                          "CRVS", "CRWD",
                          "CRWS", "CSBR", "CSCO", "CSCW", "CSGP", "CSGS", "CSII", "CSIQ", "CSOD", "CSPI", "CSSE",
                          "CSTE", "CSTL",
                          "CSTR", "CSWC", "CSWI", "CSX", "CTAQ", "CTAS", "CTBI", "CTG", "CTHR", "CTIB", "CTIC", "CTMX",
                          "CTRE",
                          "CTRM", "CTRN", "CTSH", "CTSO", "CTXR", "CTXS", "CUE", "CUEN", "CURI", "CUTR", "CVAC", "CVBF",
                          "CVCO",
                          "CVCY", "CVET", "CVGI", "CVGW", "CVLB", "CVLG", "CVLT", "CVLY", "CVV", "CWBC", "CWBR", "CWCO",
                          "CWST",
                          "CXDC", "CXDO", "CYAD", "CYAN", "CYBE", "CYBR", "CYCC", "CYCN", "CYRN", "CYRX", "CYTK",
                          "CZNC", "CZR",
                          "CZWI", "DAIO", "DAKT", "DARE", "DBDR", "DBTX", "DBVT", "DBX", "DCBO", "DCOM", "DCOM", "DCPH",
                          "DCRB",
                          "DCT", "DCTH", "DDI", "DDMX", "DDOG", "DENN", "DFFN", "DFH", "DFHT", "DFPH", "DGICA", "DGICB",
                          "DGII",
                          "DGLY", "DGNS", "DHIL", "DIOD", "DISCA", "DISCB", "DISCK", "DISH", "DJCO", "DKNG", "DLHC",
                          "DLPN",
                          "DLTH", "DLTR", "DMAC", "DMRC", "DMTK", "DNLI", "DOCU", "DOGZ", "DOMO", "DORM", "DOX", "DRIO",
                          "DRNA",
                          "DRRX", "DRVN", "DSAC", "DSGX", "DSKE", "DSP", "DSPG", "DSWL", "DTEA", "DTIL", "DTSS", "DUOT",
                          "DVAX",
                          "DWSN", "DXCM", "DXPE", "DXYN", "DYAI", "DYN", "DYNT", "DZSI", "EA", "EAR", "EARS", "EAST",
                          "EBAY",
                          "EBIX", "EBMT", "EBON", "EBSB", "EBTC", "ECHO", "ECOL", "ECOR", "ECPG", "EDIT", "EDRY",
                          "EDSA", "EDTK",
                          "EDTX", "EDUC", "EEFT", "EFOI", "EFSC", "EGAN", "EGBN", "EGLE", "EGOV", "EGRX", "EHTH",
                          "EIGR", "EKSO",
                          "ELDN", "ELOX", "ELSE", "ELTK", "ELYS", "EMB", "EMCF", "EMKR", "EML", "ENDP", "ENG", "ENLV",
                          "ENOB",
                          "ENPH", "ENSG", "ENTA", "ENTG", "ENTX", "ENVB", "EOLS", "EOSE", "EPAY", "EPSN", "EPZM", "EQ",
                          "EQBK",
                          "EQIX", "EQOS", "ERIC", "ERIE", "ERII", "ERYP", "ESBK", "ESCA", "ESEA", "ESGR", "ESLT",
                          "ESPR", "ESQ",
                          "ESSA", "ESSC", "ESTA", "ESXB", "ETAC", "ETFC", "ETNB", "ETON", "ETSY", "ETTX", "EUCR",
                          "EVBG", "EVER",
                          "EVFM", "EVGN", "EVK", "EVLO", "EVOK", "EVOL", "EVOP", "EWBC", "EXAS", "EXEL", "EXLS", "EXPC",
                          "EXPD",
                          "EXPE", "EXPI", "EXPO", "EXTR", "EYE", "EYEG", "EYEN", "EYES", "EYPT", "EZGO", "EZPW", "FAMI",
                          "FANG",
                          "FARM", "FARO", "FAST", "FAT", "FATE", "FB", "FBIO", "FBIZ", "FBMS", "FBNC", "FBRX", "FBSS",
                          "FCAC",
                          "FCAP", "FCBC", "FCBP", "FCCO", "FCCY", "FCEL", "FCFS", "FCNCA", "FCRD", "FDBC", "FDMT",
                          "FDUS", "FEIM",
                          "FELE", "FEYE", "FFBC", "FFBW", "FFHL", "FFIC", "FFIN", "FFIV", "FFNW", "FFWM", "FGBI",
                          "FGEN", "FGF",
                          "FHB", "FHTX", "FIBK", "FIII", "FISI", "FISV", "FITB", "FIVE", "FIVN", "FIXX", "FIZZ", "FLAC",
                          "FLDM",
                          "FLEX", "FLGT", "FLIC", "FLIR", "FLL", "FLMN", "FLNT", "FLUX", "FLWS", "FLXN", "FLXS", "FMAO",
                          "FMBH",
                          "FMBI", "FMNB", "FMTX", "FNCB", "FNHC", "FNKO", "FNLC", "FNWB", "FOCS", "FOLD", "FONR",
                          "FORD", "FORK",
                          "FORM", "FORR", "FOSL", "FOX", "FOXA", "FOXF", "FPAY", "FPRX", "FRAF", "FRBA", "FRBK", "FREE",
                          "FREQ",
                          "FRG", "FRGI", "FRHC", "FRME", "FROG", "FRPH", "FRPT", "FRTA", "FSBW", "FSEA", "FSFG", "FSLR",
                          "FSRV",
                          "FSTR", "FSTX", "FTCV", "FTDR", "FTEK", "FTFT", "FTHM", "FTIV", "FTNT", "FTOC", "FULC",
                          "FULT", "FUNC",
                          "FUSB", "FUSN", "FUV", "FVAM", "FVCB", "FVE", "FWAA", "FWRD", "FXNC", "GABC", "GAIA", "GAIN",
                          "GALT",
                          "GAN", "GASS", "GBCI", "GBDC", "GBIO", "GBLI", "GBNY", "GBS", "GBT", "GCBC", "GCMG", "GDEN",
                          "GDRX",
                          "GDYN", "GECC", "GEG", "GENC", "GENE", "GEOS", "GERN", "GEVO", "GFED", "GFN", "GH", "GHSI",
                          "GHVI",
                          "GIFI", "GIGM", "GIII", "GILD", "GILT", "GLAD", "GLAQ", "GLBS", "GLBZ", "GLDD", "GLG", "GLMD",
                          "GLNG",
                          "GLPG", "GLRE", "GLSI", "GLTO", "GLUU", "GLYC", "GMAB", "GMBL", "GMDA", "GMTX", "GNCA",
                          "GNFT", "GNLN",
                          "GNMK", "GNOG", "GNPX", "GNRS", "GNSS", "GNTX", "GNTY", "GNUS", "GO", "GOCO", "GOEV", "GOGL",
                          "GOGO",
                          "GOOD", "GOOG", "GOOGL", "GOSS", "GOVX", "GP", "GPRE", "GPRO", "GRAY", "GRBK", "GRCY", "GRFS",
                          "GRIL",
                          "GRIN", "GRMN", "GRNQ", "GRNV", "GROW", "GRPN", "GRSV", "GRTS", "GRTX", "GRWG", "GSBC",
                          "GSHD", "GSIT",
                          "GSKY", "GSM", "GSMG", "GT", "GTBP", "GTEC", "GTHX", "GTIM", "GTLS", "GTYH", "GURE", "GVP",
                          "GWAC",
                          "GWGH", "GWRS", "GXGX", "GYRO", "HA", "HAAC", "HAFC", "HAIN", "HALL", "HALO", "HAPP", "HARP",
                          "HAS",
                          "HAYN", "HBAN", "HBCP", "HBIO", "HBMD", "HBNC", "HBP", "HBT", "HCAP", "HCAQ", "HCAR", "HCAT",
                          "HCCI",
                          "HCKT", "HCM", "HCSG", "HDSN", "HEAR", "HEC", "HEES", "HELE", "HEPA", "HFBL", "HFFG", "HFWA",
                          "HGEN",
                          "HGSH", "HIBB", "HIFS", "HIHO", "HJLI", "HKIT", "HLIO", "HLIT", "HLNE", "HLXA", "HMCO",
                          "HMHC", "HMNF",
                          "HMPT", "HMST", "HMSY", "HMTV", "HNNA", "HNRG", "HOFT", "HOFV", "HOL", "HOLI", "HOLX", "HOMB",
                          "HONE",
                          "HOOK", "HOPE", "HOTH", "HPK", "HQI", "HQY", "HRMY", "HROW", "HRTX", "HRZN", "HSAQ", "HSDT",
                          "HSIC",
                          "HSII", "HSKA", "HSON", "HST", "HSTM", "HSTO", "HTBI", "HTBK", "HTBX", "HTGM", "HTHT", "HTLD",
                          "HTLF",
                          "HTOO", "HUBG", "HUDI", "HURC", "HURN", "HUSN", "HVBC", "HWBK", "HWC", "HWCC", "HWKN", "HYFM",
                          "HYGO",
                          "HYMC", "HYRE", "HZNP", "IAC", "IBCP", "IBEX", "IBIO", "IBKR", "IBOC", "IBTX", "ICAD", "ICBK",
                          "ICCC",
                          "ICCH", "ICFI", "ICHR", "ICLR", "ICMB", "ICON", "ICPT", "ICUI", "IDCC", "IDEX", "IDN", "IDRA",
                          "IDXG",
                          "IDXX", "IDYA", "IEA", "IEC", "IEP", "IESC", "IFMK", "IFRX", "IGAC", "IGIC", "IGMS", "IHRT",
                          "III",
                          "IIII", "IIIN", "IIIV", "IIN", "IIVI", "IKNX", "IKT", "ILMN", "IMAC", "IMBI", "IMGN", "IMKTA",
                          "IMMP",
                          "IMMR", "IMNM", "IMRA", "IMRN", "IMTE", "IMTX", "IMUX", "IMV", "IMVT", "IMXI", "INAB", "INAP",
                          "INBK",
                          "INBX", "INCY", "INDB", "INDT", "INFI", "INFN", "INGN", "INMB", "INMD", "INO", "INOD", "INOV",
                          "INPX",
                          "INSE", "INSG", "INSM", "INTC", "INTG", "INTU", "INTZ", "INVA", "INVE", "INWK", "INZY",
                          "IONS", "IOSP",
                          "IOVA", "IPAR", "IPDN", "IPGP", "IPHA", "IPHI", "IPWR", "IRBT", "IRDM", "IRIX", "IRMD",
                          "IROQ", "IRTC",
                          "IRWD", "ISBC", "ISEE", "ISIG", "ISNS", "ISRG", "ISSC", "ISTR", "ISUN", "ITAC", "ITCI", "ITI",
                          "ITIC",
                          "ITOS", "ITRI", "ITRM", "ITRN", "IVA", "IVAC", "IZEA", "JACK", "JAGX", "JAKK", "JAMF", "JAN",
                          "JAZZ",
                          "JBHT", "JBLU", "JBSS", "JCOM", "JCS", "JCTCF", "JJSF", "JKHY", "JNCE", "JOUT", "JRSH",
                          "JRVR", "JUPW",
                          "JVA", "JYAC", "JYNT", "KALA", "KALU", "KALV", "KBAL", "KBNT", "KBSF", "KDMN", "KDNY", "KE",
                          "KELYA",
                          "KELYB", "KEQU", "KERN", "KFFB", "KFRC", "KHC", "KIDS", "KIN", "KINS", "KIRK", "KLAC", "KLDO",
                          "KLIC",
                          "KLXE", "KMDA", "KMPH", "KNDI", "KNSA", "KNSL", "KNTE", "KOD", "KOPN", "KOSS", "KPTI", "KRBP",
                          "KRMD",
                          "KRNT", "KRNY", "KRON", "KROS", "KRTX", "KRUS", "KRYS", "KSMT", "KSPN", "KTCC", "KTOS",
                          "KTRA", "KURA",
                          "KVHI", "KXIN", "KYMR", "KZIA", "KZR", "LABP", "LACQ", "LAKE", "LANC", "LAND", "LARK", "LASR",
                          "LATN",
                          "LAUR", "LAWS", "LAZR", "LAZY", "LBAI", "LBC", "LBRDA", "LBRDK", "LBTYA", "LBTYB", "LBTYK",
                          "LCAP",
                          "LCNB", "LCUT", "LCY", "LE", "LECO", "LEDS", "LEGH", "LESL", "LEVL", "LEXX", "LFTR", "LFUS",
                          "LFVN",
                          "LGIH", "LGND", "LGVN", "LHCG", "LHDX", "LIFE", "LILA", "LILAK", "LINC", "LIND", "LIQT",
                          "LITE", "LIVE",
                          "LIVK", "LIVN", "LIVX", "LIXT", "LJPC", "LKCO", "LKFN", "LKQ", "LLIT", "LLNW", "LMAT", "LMB",
                          "LMFA",
                          "LMNL", "LMNR", "LMNX", "LMPX", "LMRK", "LMST", "LNDC", "LNT", "LNTH", "LOAC", "LOB", "LOCO",
                          "LOGC",
                          "LOGI", "LOGM", "LONE", "LOOP", "LOPE", "LORL", "LOTZ", "LOVE", "LPCN", "LPLA", "LPRO",
                          "LPSN", "LPTH",
                          "LPTX", "LQDA", "LQDT", "LRCX", "LRMR", "LSAQ", "LSBK", "LSCC", "LSEA", "LSTR", "LTBR",
                          "LTRN", "LTRPA",
                          "LTRPB", "LTRX", "LULU", "LUMO", "LUNA", "LUNG", "LUXA", "LWAY", "LXRX", "LYFT", "LYL",
                          "LYRA", "LYTS",
                          "MAAC", "MACK", "MACU", "MAGS", "MANH", "MANT", "MAR", "MARA", "MARK", "MASI", "MASS", "MAT",
                          "MATW",
                          "MAXN", "MAYS", "MBCN", "MBII", "MBIN", "MBIO", "MBOT", "MBRX", "MBUU", "MBWM", "MCBC",
                          "MCBS", "MCFE",
                          "MCFT", "MCHP", "MCHX", "MCMJ", "MCRB", "MCRI", "MDB", "MDCA", "MDGL", "MDIA", "MDJH", "MDLZ",
                          "MDRR",
                          "MDRX", "MDWD", "MDWT", "MEDP", "MEDS", "MEIP", "MELI", "MERC", "MESA", "MESO", "METC",
                          "METX", "MFIN",
                          "MFNC", "MGEE", "MGI", "MGIC", "MGLN", "MGNX", "MGPI", "MGRC", "MGTA", "MGTX", "MGYR", "MHLD",
                          "MICT",
                          "MIDD", "MIK", "MILE", "MIME", "MIND", "MIRM", "MIST", "MITK", "MKGI", "MKSI", "MLAB", "MLAC",
                          "MLHR",
                          "MLND", "MLVF", "MMAC", "MMSI", "MMYT", "MNDO", "MNKD", "MNOV", "MNPR", "MNRO", "MNSB",
                          "MNST", "MNTK",
                          "MNTX", "MODV", "MOFG", "MOGO", "MOR", "MORF", "MORN", "MOSY", "MOTN", "MOTS", "MOXC", "MPAA",
                          "MPB",
                          "MPWR", "MRAC", "MRAM", "MRBK", "MRCC", "MRCY", "MREO", "MRIN", "MRKR", "MRLN", "MRNA",
                          "MRNS", "MRSN",
                          "MRTN", "MRTX", "MRUS", "MRVI", "MRVL", "MSBI", "MSEX", "MSFT", "MSGM", "MSON", "MSTR",
                          "MSVB", "MTAC",
                          "MTBC", "MTC", "MTCH", "MTCR", "MTEM", "MTEX", "MTP", "MTRX", "MTSC", "MTSI", "MTSL", "MU",
                          "MUDS",
                          "MVBF", "MVIS", "MWK", "MXIM", "MYFW", "MYGN", "MYRG", "MYT", "NAII", "NAKD", "NAOV", "NARI",
                          "NATH",
                          "NATI", "NATR", "NAVI", "NBAC", "NBEV", "NBIX", "NBN", "NBRV", "NBSE", "NBTB", "NBTX", "NCBS",
                          "NCMI",
                          "NCNO", "NCSM", "NDAQ", "NDLS", "NDRA", "NDSN", "NEBC", "NEO", "NEOG", "NEON", "NEOS", "NEPH",
                          "NERV",
                          "NESR", "NETE", "NEWA", "NEWT", "NEXI", "NEXT", "NFBK", "NFE", "NFLX", "NGAC", "NGM", "NGMS",
                          "NH",
                          "NHIC", "NHLD", "NHTC", "NICK", "NISN", "NK", "NKLA", "NKSH", "NKTR", "NKTX", "NLOK", "NLSP",
                          "NLTX",
                          "NMFC", "NMIH", "NMMC", "NMRD", "NMRK", "NMTR", "NNBR", "NNOX", "NOAC", "NODK", "NOVN",
                          "NOVT", "NPA",
                          "NRBO", "NRC", "NRIM", "NRIX", "NSEC", "NSIT", "NSSC", "NSTG", "NSYS", "NTAP", "NTCT", "NTEC",
                          "NTGR",
                          "NTIC", "NTLA", "NTNX", "NTRA", "NTRP", "NTRS", "NTUS", "NTWK", "NUAN", "NURO", "NUVA",
                          "NUZE", "NVAX",
                          "NVCR", "NVDA", "NVEC", "NVEE", "NVFY", "NVIV", "NVMI", "NWBI", "NWFL", "NWL", "NWLI", "NWPX",
                          "NWS",
                          "NWSA", "NXGN", "NXPI", "NXST", "NXTC", "NXTD", "NYMX", "OBAS", "OBCI", "OBLG", "OBLN",
                          "OBNK", "OBSV",
                          "OCC", "OCDX", "OCFC", "OCG", "OCGN", "OCSI", "OCSL", "OCUL", "ODFL", "ODP", "ODT", "OEG",
                          "OESX",
                          "OFED", "OFIX", "OFLX", "OFS", "OGI", "OKTA", "OLB", "OLED", "OLLI", "OLMA", "OM", "OMAB",
                          "OMCL",
                          "OMEG", "OMER", "OMEX", "OMP", "ON", "ONB", "ONCR", "ONCS", "ONCT", "ONDS", "ONEM", "ONEW",
                          "ONTX",
                          "ONVO", "OPBK", "OPCH", "OPEN", "OPGN", "OPHC", "OPK", "OPNT", "OPOF", "OPRT", "OPRX", "OPT",
                          "OPTN",
                          "OPTT", "ORBC", "ORGO", "ORGS", "ORIC", "ORLY", "ORMP", "ORRF", "OSBC", "OSIS", "OSMT",
                          "OSPN", "OSS",
                          "OSTK", "OSUR", "OSW", "OTEL", "OTIC", "OTLK", "OTRA", "OTRK", "OTTR", "OVBC", "OVID", "OVLY",
                          "OXBR",
                          "OXFD", "OXLC", "OXSQ", "OYST", "OZK", "PAAS", "PACB", "PACW", "PAE", "PAHC", "PAIC", "PAND",
                          "PANL",
                          "PASG", "PATI", "PATK", "PAVM", "PAX", "PAYA", "PAYS", "PAYX", "PBCT", "PBFS", "PBHC", "PBIP",
                          "PBPB",
                          "PBTS", "PBYI", "PCAR", "PCB", "PCRX", "PCSB", "PCTI", "PCTY", "PCVX", "PCYG", "PCYO", "PDCE",
                          "PDCO",
                          "PDEX", "PDFS", "PDLB", "PDLI", "PDSB", "PEBK", "PEBO", "PEGA", "PENN", "PEP", "PERI", "PESI",
                          "PETQ",
                          "PETS", "PETZ", "PFBC", "PFBI", "PFC", "PFG", "PFHD", "PFIE", "PFIN", "PFIS", "PFLT", "PFMT",
                          "PFPT",
                          "PFSW", "PFX", "PGC", "PGEN", "PGNY", "PHAS", "PHAT", "PHCF", "PHIC", "PHIO", "PHUN", "PHVS",
                          "PI",
                          "PICO", "PINC", "PING", "PIRS", "PIXY", "PKBK", "PKOH", "PLAB", "PLAY", "PLBC", "PLBY",
                          "PLCE", "PLIN",
                          "PLL", "PLMR", "PLPC", "PLRX", "PLSE", "PLTK", "PLUG", "PLUS", "PLXP", "PLXS", "PLYA", "PMBC",
                          "PMD",
                          "PME", "PMVP", "PNBK", "PNFP", "PNNT", "PNRG", "PNTG", "POAI", "PODD", "POLA", "POOL", "POSH",
                          "POWI",
                          "POWL", "PPBI", "PPC", "PPD", "PPIH", "PPSI", "PRAA", "PRAH", "PRAX", "PRCH", "PRCP", "PRDO",
                          "PRFT",
                          "PRFX", "PRGS", "PRGX", "PRIM", "PRLD", "PROG", "PROV", "PRPH", "PRPL", "PRPO", "PRQR",
                          "PRTA", "PRTH",
                          "PRTK", "PRTS", "PRVB", "PS", "PSAC", "PSHG", "PSMT", "PSNL", "PSTI", "PSTV", "PSTX", "PTC",
                          "PTCT",
                          "PTE", "PTEN", "PTGX", "PTIC", "PTMN", "PTON", "PTRS", "PTSI", "PTVCA", "PTVCB", "PTVE",
                          "PUBM", "PULM",
                          "PVAC", "PVBC", "PWFL", "PWOD", "PXLW", "PXS", "PYPD", "PYPL", "PZZA", "QADA", "QADB", "QCOM",
                          "QCRH",
                          "QDEL", "QELL", "QLGN", "QLYS", "QMCO", "QNST", "QRHC", "QRTEA", "QRTEA", "QRVO", "QTNT",
                          "QTRX", "QUIK",
                          "QUMU", "QURE", "RAAC", "RACA", "RADA", "RAIL", "RAND", "RAPT", "RARE", "RAVE", "RAVN", "RBB",
                          "RBBN",
                          "RBCAA", "RBCN", "RBKB", "RBNC", "RCEL", "RCHG", "RCII", "RCKT", "RCKY", "RCM", "RCMT",
                          "RCON", "RDCM",
                          "RDFN", "RDI", "RDIB", "RDNT", "RDUS", "RDVT", "RDWR", "REAL", "REED", "REFR", "REG", "REGI",
                          "REGN",
                          "REKR", "RELID", "RELL", "REPH", "REPL", "RESN", "RETA", "RETO", "REXN", "REYN", "RFIL",
                          "RGCO", "RGEN",
                          "RGLD", "RGLS", "RGNX", "RGP", "RIBT", "RICK", "RIDE", "RIGL", "RILY", "RIOT", "RIVE", "RKDA",
                          "RLAY",
                          "RLMD", "RMBI", "RMBL", "RMBS", "RMCF", "RMGB", "RMNI", "RMR", "RMTI", "RNA", "RNDB", "RNET",
                          "RNLX",
                          "RNST", "RNWK", "ROAD", "ROCH", "ROCK", "ROKU", "ROLL", "ROOT", "ROST", "RP", "RPAY", "RPD",
                          "RPRX",
                          "RPTX", "RRBI", "RRGB", "RRR", "RSSS", "RSVA", "RUBY", "RUN", "RUSHA", "RUSHB", "RUTH",
                          "RVMD", "RVNC",
                          "RVPH", "RVSB", "RWLK", "RXT", "RYAAY", "RYTM", "SABR", "SAFM", "SAFT", "SAGE", "SAIA",
                          "SAII", "SAL",
                          "SALM", "SAMG", "SANA", "SANM", "SANW", "SASR", "SATS", "SAVA", "SBAC", "SBBP", "SBCF",
                          "SBFG", "SBGI",
                          "SBLK", "SBNY", "SBRA", "SBSI", "SBT", "SBTX", "SBUX", "SCHL", "SCHN", "SCKT", "SCOA", "SCOR",
                          "SCPH",
                          "SCPL", "SCPS", "SCSC", "SCVL", "SCWX", "SCYX", "SDC", "SDGR", "SDH", "SEAC", "SEDG", "SEED",
                          "SEEL",
                          "SEER", "SEIC", "SELB", "SENEA", "SENEB", "SESN", "SFBC", "SFBS", "SFIX", "SFM", "SFNC",
                          "SFST", "SFT",
                          "SG", "SGA", "SGAM", "SGBX", "SGC", "SGEN", "SGH", "SGLB", "SGMA", "SGMO", "SGMS", "SGOC",
                          "SGRP",
                          "SGRY", "SGTX", "SHBI", "SHC", "SHEN", "SHIP", "SHLS", "SHOO", "SHSP", "SHYF", "SIBN", "SIC",
                          "SIEB",
                          "SIEN", "SIGA", "SIGI", "SILC", "SILK", "SINA", "SINO", "SINT", "SIOX", "SIRI", "SITM",
                          "SIVB", "SJ",
                          "SKYW", "SLAB", "SLCT", "SLDB", "SLGG", "SLGL", "SLGN", "SLM", "SLN", "SLNO", "SLP", "SLRC",
                          "SLRX",
                          "SLS", "SMBC", "SMBK", "SMED", "SMIT", "SMMF", "SMMT", "SMPL", "SMSI", "SMTC", "SMTX", "SNBR",
                          "SNCA",
                          "SND", "SNDE", "SNDL", "SNDX", "SNES", "SNEX", "SNFCA", "SNGX", "SNOA", "SNPS", "SNRH",
                          "SNSE", "SNSS",
                          "SNY", "SOHU", "SOLO", "SOLY", "SONA", "SONM", "SONN", "SONO", "SP", "SPCB", "SPEL", "SPFI",
                          "SPI",
                          "SPKE", "SPLK", "SPNE", "SPNS", "SPOK", "SPPI", "SPRB", "SPRO", "SPRT", "SPSC", "SPT", "SPTN",
                          "SPWH",
                          "SPWR", "SQBG", "SQFT", "SQQQ", "SRAC", "SRAX", "SRCE", "SRCL", "SRDX", "SREV", "SRGA",
                          "SRNE", "SRPT",
                          "SRRA", "SRRK", "SRSA", "SRTS", "SSB", "SSBI", "SSKN", "SSNC", "SSNT", "SSP", "SSPK", "SSSS",
                          "SSTI",
                          "SSYS", "STAA", "STAF", "STBA", "STCN", "STEP", "STFC", "STIM", "STKS", "STLD", "STMP",
                          "STND", "STNE",
                          "STOK", "STRA", "STRL", "STRM", "STRO", "STRR", "STRS", "STRT", "STSA", "STTK", "STWO", "STX",
                          "STXB",
                          "SUMO", "SUMR", "SUNS", "SUNW", "SUPN", "SURF", "SV", "SVA", "SVAC", "SVBI", "SVFA", "SVMK",
                          "SVOK",
                          "SVRA", "SVVC", "SWAV", "SWBI", "SWIR", "SWKH", "SWKS", "SWTX", "SXTC", "SYBT", "SYBX",
                          "SYKE", "SYNA",
                          "SYNC", "SYNH", "SYNL", "SYPR", "SYRS", "SYTA", "TA", "TACO", "TACT", "TAIT", "TANH", "TAOP",
                          "TARA",
                          "TARS", "TAST", "TATT", "TAYD", "TBA", "TBBK", "TBIO", "TBK", "TBLT", "TBNK", "TBPH", "TCBI",
                          "TCBK",
                          "TCCO", "TCDA", "TCF", "TCFC", "TCMD", "TCON", "TCPC", "TCRR", "TCX", "TDAC", "TEAM", "TECH",
                          "TEKK",
                          "TELA", "TELL", "TENB", "TENX", "TER", "TERN", "TESS", "TFFP", "TFSL", "TGLS", "TGTX", "TH",
                          "THBR",
                          "THCA", "THCB", "THFF", "THMO", "THRC", "THRM", "TIG", "TIGO", "TILE", "TIPT", "TIRX", "TITN",
                          "TLGT",
                          "TLIS", "TLMD", "TLRY", "TLS", "TLSA", "TLT", "TMDI", "TMDX", "TMPM", "TMTS", "TMUS", "TNAV",
                          "TNDM",
                          "TNXP", "TOPS", "TOWN", "TPCO", "TPIC", "TPTX", "TQQQ", "TRCH", "TREE", "TRIL", "TRIN",
                          "TRIP", "TRIT",
                          "TRMB", "TRMK", "TRNS", "TROW", "TRS", "TRST", "TRUE", "TRUP", "TRVI", "TRVN", "TSBK", "TSC",
                          "TSCO",
                          "TSEM", "TSHA", "TSIA", "TSLA", "TSRI", "TTCF", "TTD", "TTEK", "TTGT", "TTMI", "TTNP", "TTOO",
                          "TTWO",
                          "TUSK", "TVIX", "TVTX", "TVTY", "TW", "TWCT", "TWIN", "TWNK", "TWOU", "TWST", "TXG", "TXMD",
                          "TXN",
                          "TXRH", "TYHT", "TYME", "TZOO", "UAL", "UBCP", "UBFO", "UBOH", "UBSI", "UBX", "UCBI", "UCTT",
                          "UEIC",
                          "UEPS", "UFCS", "UFPI", "UFPT", "UG", "UGRO", "UHAL", "UIHC", "UK", "ULBI", "ULH", "UMBF",
                          "UMPQ",
                          "UNAM", "UNB", "UNIT", "UNTY", "UONE", "UONEK", "UPLD", "UPST", "UPWK", "URBN", "URGN",
                          "UROV", "USAK",
                          "USAP", "USAT", "USAU", "USCR", "USEG", "USIO", "USLM", "USWS", "UTHR", "UTMD", "UTSI",
                          "UVSP", "VACQ",
                          "VALU", "VBFC", "VBIV", "VBLT", "VBTX", "VC", "VCEL", "VCNX", "VCTR", "VCVC", "VCYT", "VECO",
                          "VEON",
                          "VERB", "VERI", "VERO", "VERU", "VERX", "VERY", "VFF", "VIAC", "VIACA", "VIAV", "VICR", "VIE",
                          "VIH",
                          "VII", "VINC", "VINP", "VIR", "VIRC", "VIRI", "VIRT", "VISL", "VITL", "VIVE", "VIVO", "VKTX",
                          "VLGEA",
                          "VLON", "VLY", "VMAC", "VMAR", "VMD", "VNDA", "VNOM", "VOD", "VOR", "VOXX", "VRA", "VRAY",
                          "VRCA",
                          "VRDN", "VREX", "VRM", "VRME", "VRNA", "VRNS", "VRNT", "VRRM", "VRSK", "VRSN", "VRTS", "VRTU",
                          "VRTX",
                          "VSAT", "VSEC", "VSPR", "VSTA", "VSTM", "VTAQ", "VTGN", "VTNR", "VTRS", "VTSI", "VTVT",
                          "VUZI", "VVOS",
                          "VVPR", "VXRT", "VYGR", "VYNE", "WABC", "WAFD", "WAFU", "WASH", "WATT", "WBA", "WDAY", "WDC",
                          "WDFC",
                          "WEN", "WERN", "WETF", "WEYS", "WHF", "WHLM", "WIFI", "WILC", "WINA", "WING", "WINT", "WIRE",
                          "WISA",
                          "WISH", "WIX", "WKEY", "WKHS", "WLDN", "WLFC", "WLTW", "WMG", "WNEB", "WNW", "WOOF", "WORX",
                          "WRAP",
                          "WRLD", "WSBC", "WSBF", "WSC", "WSFS", "WSTG", "WTBA", "WTER", "WTFC", "WTRE", "WTRH", "WVE",
                          "WVFC",
                          "WVVI", "WW", "WWD", "WWR", "WYNN", "XAIR", "XBIO", "XBIT", "XCUR", "XEL", "XELA", "XELB",
                          "XENE",
                          "XENT", "XERS", "XFOR", "XGN", "XLNX", "XLRN", "XM", "XNCR", "XOGAQ", "XOMA", "XONE", "XP",
                          "XPEL",
                          "XPER", "XRAY", "XSPA", "YELL", "YGMZ", "YMAB", "YMTX", "YNDX", "YORW", "YQ", "YSAC", "YTEN",
                          "YTRA",
                          "YVR", "Z", "ZAGG", "ZBRA", "ZCMD", "ZEAL", "ZEUS", "ZG", "ZGNX", "ZGYH", "ZI", "ZION",
                          "ZIOP", "ZIXI",
                          "ZKIN", "ZM", "ZNGA", "ZNTE", "ZNTL", "ZS", "ZSAN", "ZUMZ", "ZVO", "ZYNE", "ZYXI"]
    prices_df, volume_df = stock_cache.get_prices(symbols=None)
    symbols = intersection(prices_df.columns, trading212_symbols)

    start_date = datetime(2020, 1, 2)
    stock_simulator = StockSimulator(
        symbols=symbols,
        entry_strategy=WorstFallEntryStrategy(),  # AboveMaxEntryStrategy(),  # BollingerLowEntryStrategy(),
        exit_strategy=HoldingDaysExitStrategy(),  # TrailingExitStrategy(),
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
