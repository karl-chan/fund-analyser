module Model exposing (..)

import Fund exposing (..)
import Http
import Pages exposing (..)
import Port exposing (..)
import Server exposing (..)


---- MODEL ----


type alias Model =
    { server : Server
    , page : Page
    , funds : Maybe Funds
    }


type Msg
    = NoOp
    | SwitchPage Page
    | UpdateFunds (Result Http.Error Funds)



---- UPDATE ----


update : Msg -> Model -> ( Model, Cmd Msg )
update msg model =
    case msg of
        NoOp ->
            model ! []

        SwitchPage newPage ->
            { model | page = newPage } ! []

        UpdateFunds httpResult ->
            case Debug.log "httpResult" httpResult of
                Ok newFunds ->
                    { model | funds = Just newFunds } ! [ notifyDatatable () ]

                Err error ->
                    model ! []
