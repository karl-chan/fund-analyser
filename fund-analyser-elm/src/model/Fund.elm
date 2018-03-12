module Fund exposing (..)

import Date exposing (..)
import Dict exposing (..)
import Json.Decode exposing (Decoder, dict, float, list, nullable, string)
import Json.Decode.Extra exposing (date)
import Json.Decode.Pipeline exposing (decode, optional, required)


---- TYPEDEF ----


type alias Fund =
    { isin : String
    , name : String
    , type_ : String
    , shareClass : String
    , frequency : String
    , ocf : Maybe Float
    , amc : Maybe Float
    , entryCharge : Maybe Float
    , exitCharge : Maybe Float
    , holdings : Maybe (List Holding)
    , historicPrices : Maybe (List HistoricPrice)
    , returns : Returns
    }


type alias Funds =
    List Fund


type alias Holding =
    { name : String
    , symbol : String
    , weight : Float
    }


type alias HistoricPrice =
    { date : Date
    , price : Float
    }


type alias Returns =
    Dict String (Maybe Float)



---- DECODER ----


fund : Decoder Fund
fund =
    decode Fund
        |> required "isin" string
        |> required "name" string
        |> required "type" string
        |> required "shareClass" string
        |> required "frequency" string
        |> optional "ocf" (nullable float) Nothing
        |> optional "amc" (nullable float) Nothing
        |> optional "entryCharge" (nullable float) Nothing
        |> optional "exitCharge" (nullable float) Nothing
        |> optional "holdings" (nullable holdings) Nothing
        |> optional "historicPrices" (nullable historicPrices) Nothing
        |> required "returns" returns


funds : Decoder Funds
funds =
    list fund


holding : Decoder Holding
holding =
    decode Holding
        |> required "name" string
        |> required "symbol" string
        |> required "weight" float


holdings : Decoder (List Holding)
holdings =
    list holding


historicPrice : Decoder HistoricPrice
historicPrice =
    decode HistoricPrice
        |> required "date" date
        |> required "price" float


historicPrices : Decoder (List HistoricPrice)
historicPrices =
    list historicPrice


returns : Decoder Returns
returns =
    dict (nullable float)



---- DEFAULTS ----


defaultFields : List String
defaultFields =
    [ "isin"
    , "name"
    , "type"
    , "shareClass"
    , "frequency"
    , "ocf"
    , "amc"
    , "entryCharge"
    , "exitCharge"
    , "returns.5Y"
    , "returns.3Y"
    , "returns.1Y"
    , "returns.6M"
    , "returns.3M"
    , "returns.1M"
    , "returns.2W"
    , "returns.1W"
    , "returns.3D"
    , "returns.1D"
    ]
